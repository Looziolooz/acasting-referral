'use client'

import { useState, useEffect, useRef } from 'react'

const COLORS = {
  bg: "#0a0a0a",
  bgCard: "#111111",
  bgCardHover: "#1a1a1a",
  border: "#222222",
  borderAccent: "#333333",
  text: "#ffffff",
  textMuted: "#888888",
  textSecondary: "#aaaaaa",
  accent: "#7236d7",
  accentGlow: "#5b2ab5",
  accentDark: "#1e1036",
  gold: "#e8c547",
  goldGlow: "#d4a017",
  success: "#4ade80",
  successDark: "#166534",
}

function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center text-xl font-bold text-bg shadow-[0_0_24px_rgba(200,162,255,0.25)] flex-shrink-0">
      {n}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all flex items-center gap-2 ${
        copied ? 'bg-success-dark text-success' : 'bg-accent text-bg'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Kopierad!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Kopiera länk
        </>
      )}
    </button>
  )
}

function RewardCard({ icon, title, description, highlight }: { icon: string; title: string; description: string; highlight?: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex-1 min-w-[260px] basis-[280px] p-7 rounded-2xl border transition-all duration-35 cursor-pointer ${
        hovered 
          ? 'bg-bg-card-hover border-accent/60 -translate-y-1 shadow-[0_8px_40px_rgba(200,162,255,0.08)]' 
          : 'bg-bg-card border-border'
      }`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-text tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-3">{description}</p>
      {highlight && (
        <span className="inline-block px-3 py-1 rounded-full bg-accent-dark text-accent text-sm font-semibold">
          {highlight}
        </span>
      )}
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b border-border cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center py-5">
        <h3 className="text-base font-semibold text-text m-0">{question}</h3>
        <span 
          className="text-accent text-2xl font-light transition-transform duration-300"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}
        >
          +
        </span>
      </div>
      <div 
        className="overflow-hidden transition-[max-height] duration-400"
        style={{ maxHeight: open ? 200 : 0 }}
      >
        <p className="text-base text-text-secondary leading-relaxed pb-5">{answer}</p>
      </div>
    </div>
  )
}

export default function ReferralPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const referralLink = "https://www.acasting.se/signup?ref=DITT_ID"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center px-6 py-20 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(200,162,255,0.09)_0%,transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(232,197,71,0.06)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-[800px]">
          <AnimatedSection delay={0}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-dark border border-accent/30 mb-8">
              <span className="text-lg">🎁</span>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Referral-program</span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.08] tracking-tight mb-6 bg-gradient-to-br from-text to-accent bg-clip-text text-transparent">
              Bjud in vänner.<br />Få Premium gratis.
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-[clamp(1rem,2.2vw,1.25rem)] text-text-secondary leading-relaxed max-w-[560px] mx-auto mb-10">
              Dela din unika referral-länk med vänner och kollegor. 
              För varje person som registrerar sig får du gratis Premium-tid 
              – och de får också en bonus.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-bg font-bold text-base transition-all hover:opacity-90"
              >
                Så fungerar det
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
              <a
                href="#share"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-transparent border border-border-accent text-text font-semibold text-base transition-all hover:border-accent/50"
              >
                Dela nu
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-[800px] mx-auto px-6 py-20">
        <AnimatedSection>
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Så fungerar det</p>
          <h2 className="text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-tight mb-12 leading-tight">
            Tre steg till gratis Premium
          </h2>
        </AnimatedSection>

        <div className="flex flex-col gap-9">
          {[
            {
              n: 1,
              title: "Dela din länk",
              desc: "Hitta din unika referral-länk i din Acasting-profil. Dela den via sociala medier, mejl eller direkt till vänner som passar på plattformen.",
            },
            {
              n: 2,
              title: "Vännen registrerar sig",
              desc: "När någon registrerar sig via din länk får de automatiskt 7 dagars gratis Premium. Registrerar de sig inom 48 timmar? Då får de 14 dagars bonus.",
            },
            {
              n: 3,
              title: "Du får Premium gratis",
              desc: "Du får 1 månad gratis Premium per referral. Tre referrals? Ytterligare 1 månad bonus. Det finns inget tak – fortsätt dela, fortsätt tjäna.",
            },
          ].map((step, i) => (
            <AnimatedSection key={i} delay={i * 0.12}>
              <div className="flex gap-5 items-start p-6 rounded-2xl bg-bg-card border border-border">
                <StepNumber n={step.n} />
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">{step.title}</h3>
                  <p className="text-base text-text-secondary leading-relaxed m-0">{step.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* REWARDS CARDS */}
      <section className="max-w-[1000px] mx-auto px-6 pb-20">
        <AnimatedSection>
          <div className="flex flex-wrap gap-5">
            <RewardCard
              icon="🎯"
              title="Prioriterad profil"
              description="Premium-medlemmar hamnar högst upp i sökningar. Fler ögon på din profil = fler chanser."
              highlight="Premium-förmån"
            />
            <RewardCard
              icon="🤖"
              title="Digital Twin"
              description="Licensiera ditt utseende för AI-genererade bilder och öppna en helt ny inkomstkälla."
              highlight="AI-licensiering"
            />
            <RewardCard
              icon="🔒"
              title="Utökad sekretess"
              description="Kontrollera vem som ser din profil. Begränsa åtkomst till enbart registrerade företag."
              highlight="Integritet"
            />
          </div>
        </AnimatedSection>
      </section>

      {/* SHARE SECTION */}
      <section id="share" className="max-w-[800px] mx-auto px-6 pb-20">
        <AnimatedSection>
          <div className="bg-bg-card border border-border rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(200,162,255,0.09)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10">
              <span className="text-5xl block mb-4">🔗</span>
              <h2 className="text-2xl font-extrabold mb-3 tracking-tight">Din referral-länk</h2>
              <p className="text-base text-text-secondary mb-7">
                Kopiera och dela med vänner – de får Premium-bonus och du också.
              </p>

              <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-bg border border-border rounded-xl max-w-[500px] mx-auto">
                <code className="text-sm text-accent break-all flex-1 text-left font-mono">
                  {referralLink}
                </code>
                <CopyButton text={referralLink} />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* INVITE BY EMAIL */}
      <section className="max-w-[800px] mx-auto px-6 pb-20">
        <AnimatedSection>
          <div className="bg-bg-card border border-border rounded-2xl p-10">
            <h3 className="text-xl font-bold mb-2">Bjud in via e-post</h3>
            <p className="text-base text-text-secondary mb-6">
              Skriv in din väns e-postadress – vi skickar en personlig inbjudan med din referral-länk.
            </p>

            <div className="flex flex-wrap gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@exempel.se"
                className="flex-1 min-w-[260px] px-4 py-3 rounded-lg border border-border-accent bg-bg text-text text-base outline-none transition-colors focus:border-accent"
              />
              <button
                onClick={handleSubmit}
                disabled={submitted}
                className={`px-7 py-3 rounded-lg font-bold text-base cursor-pointer transition-all ${
                  submitted 
                    ? 'bg-success-dark text-success cursor-default' 
                    : 'bg-accent text-bg hover:opacity-90'
                }`}
              >
                {submitted ? "Skickat! ✓" : "Skicka inbjudan"}
              </button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* FAQ */}
      <section className="max-w-[800px] mx-auto px-6 pb-20">
        <AnimatedSection>
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Vanliga frågor</p>
          <h2 className="text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-tight mb-8">
            Har du frågor?
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="bg-bg-card border border-border rounded-2xl px-7 py-2">
            <FAQItem
              question="Hur hittar jag min referral-länk?"
              answer="Din unika referral-länk finns i din profil under 'Referral-program'. Du kan kopiera den direkt och dela via valfri kanal."
            />
            <FAQItem
              question="Finns det ett tak på belöningarna?"
              answer="Nej! Det finns inget tak. Ju fler vänner du bjuder in, desto mer gratis Premium-tid får du. Tre referrals ger dessutom en extra bonusmånad."
            />
            <FAQItem
              question="Vad får min vän?"
              answer="Din vän får 7 dagars gratis Premium direkt vid registrering. Om de registrerar sig inom 48 timmar efter att de fått din länk får de 14 dagars bonus istället."
            />
            <FAQItem
              question="Hur lång tid tar det innan jag får min Premium?"
              answer="Du får din Premium-bonus direkt när din vän slutför sin registrering via din referral-länk."
            />
            <FAQItem
              question="Kan jag dela min länk på sociala medier?"
              answer="Absolut! Dela din länk var du vill – Instagram, TikTok, LinkedIn, X, i mejl, eller i gruppchatter."
            />
          </div>
        </AnimatedSection>
      </section>

      {/* CTA FOOTER */}
      <section className="py-20 text-center border-t border-border relative overflow-hidden px-6">
        <div className="absolute bottom-[-50%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(200,162,255,0.08)_0%,transparent_70%)] pointer-events-none" />

        <AnimatedSection>
          <div className="relative z-10">
            <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-extrabold tracking-tight mb-4">
              Börja tjäna gratis Premium idag
            </h2>
            <p className="text-base text-text-secondary max-w-[480px] mx-auto mb-8">
              Dela din referral-länk och låt nätverket jobba för dig.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-br from-accent to-accent-glow text-bg font-bold text-lg shadow-[0_4px_24px_rgba(200,162,255,0.3)] transition-all hover:opacity-90"
            >
              Bli Acasting Premium
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </AnimatedSection>
      </section>
    </div>
  )
}
