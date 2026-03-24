# Acasting Referral-program – Stripe-integrationsguide

## Översikt

Det här dokumentet förklarar hur du konfigurerar Stripe för att hantera Acastings referral-program. Tanken är att skapa **kuponger och kampanjkoder** i Stripe som appliceras automatiskt när en användare registrerar sig via en referral-länk.

---

## 1. Stripe-kuponger att skapa

### Kupong: Referral-mottagare – 7 dagars gratis

```bash
# Via Stripe CLI eller Dashboard
stripe coupons create \
  --duration=once \
  --percent-off=100 \
  --duration-in-months=1 \
  --name="Referral: 7 dagars gratis Premium" \
  --metadata[type]=referral_receiver \
  --metadata[days]=7
```

### Kupong: Referral-mottagare Bonus – 14 dagar (registrering inom 48h)

```bash
stripe coupons create \
  --duration=once \
  --percent-off=100 \
  --name="Referral: 14 dagars bonus Premium" \
  --metadata[type]=referral_receiver_bonus \
  --metadata[days]=14
```

### Kupong: Referral-givare – 1 månad gratis

```bash
stripe coupons create \
  --duration=once \
  --percent-off=100 \
  --name="Referral: 1 mån gratis Premium" \
  --metadata[type]=referral_giver \
  --metadata[months]=1
```

### Kupong: Referral-givare Bonus – +1 månad per 3 referrals

```bash
stripe coupons create \
  --duration=once \
  --percent-off=100 \
  --name="Referral: Bonus +1 mån (3 refs)" \
  --metadata[type]=referral_giver_milestone \
  --metadata[months]=1 \
  --metadata[milestone]=3
```

---

## 2. Server-side-logik (Next.js API Routes)

### `app/api/referral/generate-link/route.ts`

Genererar en unik referral-länk för den inloggade användaren.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // ert auth-system (t.ex. Clerk, NextAuth)
import { db } from "@/lib/db";     // er databas (t.ex. Prisma, Drizzle)
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Kolla om det redan finns en kod
  let referral = await db.referralCode.findUnique({
    where: { userId },
  });

  if (!referral) {
    const code = nanoid(8); // t.ex. "aB3x9kLm"
    referral = await db.referralCode.create({
      data: {
        userId,
        code,
        createdAt: new Date(),
      },
    });
  }

  const link = `https://www.acasting.se/signup?ref=${referral.code}`;

  return NextResponse.json({ link, code: referral.code });
}
```

### `app/api/referral/redeem/route.ts`

När en ny användare registrerar sig med en referral-kod.

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  const { referralCode, newUserId, newUserEmail } = await req.json();

  // 1. Hitta den som refererade
  const referral = await db.referralCode.findUnique({
    where: { code: referralCode },
    include: { user: true },
  });

  if (!referral) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // 2. Registrera referralen
  const now = new Date();
  const referralRecord = await db.referralRecord.create({
    data: {
      referrerId: referral.userId,
      referredId: newUserId,
      referralCodeId: referral.id,
      createdAt: now,
    },
  });

  // 3. Beräkna bonus för mottagaren (48h-koll)
  const linkCreatedAt = referral.createdAt;
  const hoursSinceLink = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60 * 60);
  const isWithin48h = hoursSinceLink <= 48;

  // 4. Applicera kupong till den NYA användaren (mottagare)
  const receiverCouponId = isWithin48h
    ? process.env.STRIPE_COUPON_RECEIVER_BONUS_ID! // 14 dagar
    : process.env.STRIPE_COUPON_RECEIVER_ID!;       // 7 dagar

  // Om användaren redan har en Stripe-kund, uppdatera prenumerationen
  const stripeCustomer = await stripe.customers.list({
    email: newUserEmail,
    limit: 1,
  });

  if (stripeCustomer.data.length > 0) {
    const customerId = stripeCustomer.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.update(subscriptions.data[0].id, {
        coupon: receiverCouponId,
      });
    }
  }

  // 5. Räkna givarens referrals och applicera bonus
  const totalReferrals = await db.referralRecord.count({
    where: { referrerId: referral.userId },
  });

  // Applicera 1 månad gratis till givaren
  await applyGiverReward(referral.userId, totalReferrals);

  return NextResponse.json({
    success: true,
    receiverBonus: isWithin48h ? "14_days" : "7_days",
    giverTotalReferrals: totalReferrals,
  });
}

async function applyGiverReward(giverId: string, totalReferrals: number) {
  const giver = await db.user.findUnique({ where: { id: giverId } });
  if (!giver?.stripeCustomerId) return;

  // 1 månad per referral
  const giverCouponId = process.env.STRIPE_COUPON_GIVER_ID!;

  const subscriptions = await stripe.subscriptions.list({
    customer: giver.stripeCustomerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    // Lägg till en förlängd trial-period (simulerar gratis månad)
    const sub = subscriptions.data[0];
    const currentEnd = new Date(sub.current_period_end * 1000);
    const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

    await stripe.subscriptions.update(sub.id, {
      trial_end: Math.floor(newEnd.getTime() / 1000),
      proration_behavior: "none",
    });
  }

  // Bonus: +1 månad var tredje referral
  if (totalReferrals % 3 === 0 && totalReferrals > 0) {
    // Lägg till ytterligare en månad
    const subscriptions2 = await stripe.subscriptions.list({
      customer: giver.stripeCustomerId,
      status: "trialing",
      limit: 1,
    });

    if (subscriptions2.data.length > 0) {
      const sub = subscriptions2.data[0];
      const currentEnd = new Date((sub.trial_end || sub.current_period_end) * 1000);
      const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

      await stripe.subscriptions.update(sub.id, {
        trial_end: Math.floor(newEnd.getTime() / 1000),
        proration_behavior: "none",
      });
    }
  }
}
```

---

## 3. Stripe Webhook (valfritt men rekommenderat)

### `app/api/webhooks/stripe/route.ts`

För att spåra när en referral konverterar till ett betalt abonnemang.

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid sig" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      // Kontrollera om kunden blev refererad
      const customer = await stripe.customers.retrieve(sub.customer as string);
      if ("metadata" in customer && customer.metadata?.referral_code) {
        await db.referralRecord.updateMany({
          where: {
            referredId: customer.metadata.user_id,
            convertedAt: null,
          },
          data: { convertedAt: new Date() },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      // Spåra churn av referrals
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 4. Databasschema (Prisma-exempel)

```prisma
model ReferralCode {
  id        String   @id @default(cuid())
  userId    String   @unique
  code      String   @unique
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  records   ReferralRecord[]
}

model ReferralRecord {
  id             String    @id @default(cuid())
  referrerId     String
  referredId     String
  referralCodeId String
  createdAt      DateTime  @default(now())
  convertedAt    DateTime?

  referralCode   ReferralCode @relation(fields: [referralCodeId], references: [id])
}
```

---

## 5. Miljövariabler (.env)

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Kupong-ID:n (efter att du skapat dem i Stripe Dashboard)
STRIPE_COUPON_RECEIVER_ID=coupon_7days_free
STRIPE_COUPON_RECEIVER_BONUS_ID=coupon_14days_bonus
STRIPE_COUPON_GIVER_ID=coupon_1month_free
STRIPE_COUPON_GIVER_MILESTONE_ID=coupon_milestone_bonus
```

---

## 6. Trigger: E-post efter första jobbansökan

I applikationslogiken, när en användare slutför sin första jobbansökan:

```typescript
// I: app/api/jobs/apply/route.ts (eller där ni hanterar ansökningar)

import { sendReferralEmail } from "@/lib/email";

// Efter att ansökan registrerats...
const applicationCount = await db.application.count({
  where: { userId: session.user.id },
});

if (applicationCount === 1) {
  // Första ansökan! Skicka referral-mejl
  await sendReferralEmail({
    to: session.user.email,
    userName: session.user.name,
    referralLink: `https://www.acasting.se/signup?ref=${userReferralCode}`,
  });
}
```

### E-postutskick (`lib/email.ts`)

```typescript
import { Resend } from "resend"; // eller den e-postleverantör ni använder

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReferralEmail({
  to,
  userName,
  referralLink,
}: {
  to: string;
  userName: string;
  referralLink: string;
}) {
  // Använd den medföljande HTML-mallen (referral-email-template.html)
  // Byt ut placeholder-värdena:
  // {{REFERRER_NAME}} -> userName
  // {{REFERRAL_LINK}} -> referralLink

  await resend.emails.send({
    from: "Acasting <noreply@acasting.se>",
    to,
    subject: `${userName}, bjud in dina vänner och få gratis Premium!`,
    html: getEmailTemplate(userName, referralLink),
  });
}
```

---

## 7. Checklista för dig som äger sajten

- [ ] Skapa de 4 kupongerna i Stripe Dashboard
- [ ] Lägg till miljövariabler på Vercel
- [ ] Lägg till Prisma-modellerna och kör `prisma migrate`
- [ ] Integrera API-routes i Next.js-projektet
- [ ] Anslut Stripe-webhook (Stripe Dashboard → Webhooks → Add endpoint)
- [ ] Lägg in referral-sidan i routing (`app/referral/page.tsx`)
- [ ] Konfigurera e-postleverantör (Resend / SendGrid / etc.)
- [ ] Testa i testläge med `sk_test_...` innan ni går live
- [ ] Lägg till "Referral"-länk i sajtens navigering

---

## 8. Tekniska noteringar

**Varför förlänga trial istället för kuponger?**
Stripe tillåter inte att man stackar kuponger på en aktiv prenumeration. Det bästa tillvägagångssättet är att förlänga `trial_end` på prenumerationen, vilket i praktiken "ger bort" gratis tid utan att störa faktureringsperioden.

**Säkerhet:**
- Referral-koder genereras med `nanoid` (URL-säkra, inte förutsägbara)
- Endpointen `/api/referral/redeem` validerar koden innan någon bonus appliceras
- Stripe-webhooken verifierar signaturen för att förhindra attacker

**Skalbarhet:**
- Systemet är stateless – varje API-anrop är oberoende
- Referral-räkningen görs via databasfrågor, inte i minnet
- Stripe-kupongerna är återanvändbara (inte engångskoder)
