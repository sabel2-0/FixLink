"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/ThemeToggle"

type Service = {
  name: string
  /** inner SVG content for a 24×24 viewBox */
  icon: string
}

const SERVICES: Service[] = [
  {
    name: "Aircon",
    icon: '<rect x="2" y="5" width="20" height="8" rx="2"/><line x1="5" y1="9.5" x2="19" y2="9.5"/><line x1="6" y1="17" x2="5" y2="19"/><line x1="10" y1="17" x2="9" y2="20"/><line x1="14" y1="17" x2="13" y2="20"/><line x1="18" y1="17" x2="17" y2="19"/>',
  },
  {
    name: "Refrigerator",
    icon: '<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="9" y1="5.5" x2="9" y2="7.5"/><line x1="9" y1="13" x2="9" y2="15"/>',
  },
  {
    name: "Washing machine",
    icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="7" x2="20" y2="7"/><circle cx="7" cy="4.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r="4.5"/><path d="M8.5 14.5c1-1.5 2-1.5 3.5 0s2.5 1.5 3.5 0"/>',
  },
  {
    name: "TV",
    icon: '<rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  },
  {
    name: "Water heater",
    icon: '<rect x="6" y="2" width="12" height="20" rx="4"/><circle cx="12" cy="12" r="2.5"/><line x1="10" y1="4" x2="14" y2="4"/>',
  },
  {
    name: "Microwave",
    icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="11" height="8" rx="1"/><circle cx="19" cy="9" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="15" r="0.8" fill="currentColor" stroke="none"/>',
  },
  {
    name: "Electric fan",
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><path d="M12 10.5c0-2 1-3.5 3-3.5s2 2.5 0 3.5-3 0-3 0z"/><path d="M13.5 12c2 0 3.5 1 3.5 3s-2.5 2-3.5 0 0-3 0-3z"/><path d="M10.5 12c-2 0-3.5-1-3.5-3s2.5-2 3.5 0 0 3 0 3z"/><path d="M12 13.5c0 2-1 3.5-3 3.5s-2-2.5 0-3.5 3 0 3 0z"/>',
  },
  {
    name: "Rice cooker",
    icon: '<path d="M5 8h14l-1.5 12a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"/><path d="M8 8V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V8"/><line x1="9" y1="12" x2="9" y2="16"/>',
  },
  {
    name: "Electric kettle",
    icon: '<path d="M5 9h14l-1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/><path d="M3 12h2"/><path d="M19 12h2"/>',
  },
  {
    name: "Induction stove",
    icon: '<rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><circle cx="16" cy="12" r="2.5"/><line x1="4" y1="18" x2="20" y2="18"/>',
  },
]

const PROBLEMS = [
  {
    n: "01",
    title: "Trust is a gamble",
    body: "It's hard to find repair workers you can actually trust with your appliance.",
  },
  {
    n: "02",
    title: "No idea what's fair",
    body: "Customers rarely know the correct price before a technician arrives.",
  },
  {
    n: "03",
    title: "Reliability varies",
    body: "Some workers no-show, arrive late, or don't finish the job properly.",
  },
  {
    n: "04",
    title: "Searching wastes time",
    body: "Asking around for a referral takes too long. Facebook groups go unanswered.",
  },
]

const STEPS = [
  {
    n: "01",
    title: "Describe the problem",
    body: "Pick the appliance and symptoms. Add photos if it helps.",
  },
  {
    n: "02",
    title: "Pick technicians",
    body: "Choose one or more verified techs. Compare their estimates side by side.",
  },
  {
    n: "03",
    title: "Get an estimate",
    body: "Each tech sends a pre-inspection price based on your description.",
  },
  {
    n: "04",
    title: "Approve the quote",
    body: "After on-site inspection, the tech sends a formal itemized quotation.",
  },
  {
    n: "05",
    title: "Track the arrival",
    body: "Watch your technician's live location as they head to you.",
  },
  {
    n: "06",
    title: "Rate the job",
    body: "Your review helps the next customer find a good technician.",
  },
]

export default function Home() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll<HTMLElement>(".reveal")
    if (!els || els.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="min-h-dvh bg-paper">
      <style>{`
        @keyframes marquee-left {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marquee-left 60s linear infinite;
        }
        .marquee-mask {
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .marquee-item { padding: 0 1.4rem; white-space: nowrap; }

        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 900ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.in-view { opacity: 1; transform: translateY(0); }
        .reveal.delay-1 { transition-delay: 80ms; }
        .reveal.delay-2 { transition-delay: 160ms; }
        .reveal.delay-3 { transition-delay: 240ms; }

        .hero-glow {
          background:
            radial-gradient(1200px 500px at 30% -10%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%),
            radial-gradient(900px 500px at 80% 20%, color-mix(in srgb, #5AC8FA 12%, transparent), transparent 60%);
        }
        .text-gradient {
          background: linear-gradient(92deg, var(--ink) 0%, var(--ink) 55%, var(--accent) 110%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 500;
        }
        .eyebrow::before {
          content: "";
          width: 22px;
          height: 1px;
          background: var(--line-2);
        }
        .trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          background: var(--surface-2);
          color: var(--ink);
          border: 1px solid var(--line-2);
        }
        .trust-pill::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
          display: inline-block;
        }
        .hero-img-wrap {
          position: relative;
        }
        .hero-img-wrap::before {
          content: "";
          position: absolute;
          inset: -10%;
          background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%);
          z-index: 0;
          pointer-events: none;
          filter: blur(20px);
        }
        .hero-img-wrap img {
          position: relative;
          z-index: 1;
        }
        .step-num {
          font-size: 11px;
          letter-spacing: 0.18em;
          color: var(--muted);
          font-weight: 600;
        }
        .hover-lift {
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 200ms ease,
                      background 200ms ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--accent) 40%, var(--line-2));
        }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 landing-nav">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="display text-lg font-semibold text-ink tracking-tight">
            FixLink
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#problem" className="hover:text-ink transition">Problem</a>
            <a href="#how" className="hover:text-ink transition">How it works</a>
            <a href="#pricing" className="hover:text-ink transition">For technicians</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-muted hover:text-ink transition font-medium px-2">
              Log in
            </Link>
            <Link href="/register" className="btn-nav">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative hero-glow">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32 grid md:grid-cols-[1.15fr_1fr] gap-16 md:gap-12 items-center">
          <div>
            <p className="eyebrow mb-6 reveal">Verified technicians · Philippines</p>

            <h1 className="display text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tighter mb-8 reveal delay-1">
              <span className="text-gradient">Trusted appliance repair, near you.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted max-w-xl leading-relaxed mb-10 reveal delay-2">
              Aircon, ref, washer, TV, and more. Compare technicians, then approve a
              written quote before any work begins.
            </p>

            <div className="flex flex-wrap gap-3 mb-8 reveal delay-3">
              <Link href="/register" className="btn-primary">
                Find a technician
              </Link>
              <a href="#how" className="btn-secondary">
                How it works
              </a>
            </div>

            <p className="text-xs text-muted mb-8 reveal delay-3">
              Fix appliances for a living?{" "}
              <Link href="/register" className="text-accent font-medium hover:underline">
                Apply as a technician
              </Link>
            </p>

            <div className="flex flex-wrap gap-2 reveal delay-3">
              <span className="trust-pill">Verified technicians</span>
              <span className="trust-pill">Live tracking</span>
            </div>
          </div>

          <div className="hidden md:block hero-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/main_vectorv5.png"
              alt="Technician holding a wrench"
              className="w-full max-w-[520px] mx-auto reveal delay-2"
            />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <p className="eyebrow mb-6 reveal">What we fix</p>

          <h2 className="display text-3xl sm:text-4xl tracking-tighter max-w-3xl mb-14 reveal delay-1">
            Every appliance in your home.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {SERVICES.map((s, i) => (
              <div
                key={s.name}
                className={"card p-5 flex flex-col items-center text-center hover-lift reveal delay-" + (i % 4)}
              >
                <span
                  className="flex items-center justify-center rounded-2xl mb-3"
                  style={{
                    width: 52,
                    height: 52,
                    background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                    color: "var(--accent)",
                  }}
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: s.icon }}
                  />
                </span>
                <p className="text-sm font-medium text-ink leading-snug">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
          <p className="eyebrow mb-6 reveal">The problem</p>

          <h2 className="display text-4xl sm:text-5xl tracking-tighter max-w-3xl mb-16 reveal delay-1">
            Why finding a repair tech is hard.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROBLEMS.map((p, i) => (
              <div
                key={p.n}
                className={"reveal delay-" + Math.min(i, 3)}
              >
                <p className="step-num mb-5">{p.n}</p>
                <p className="text-lg font-medium text-ink mb-2 tracking-tight">{p.title}</p>
                <p className="text-sm text-muted leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
          <p className="eyebrow mb-6 reveal">How it works</p>

          <h2 className="display text-4xl sm:text-5xl tracking-tighter max-w-3xl mb-16 reveal delay-1">
            Six steps from a broken appliance to a five-star technician.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className={"reveal delay-" + (i % 3)}
              >
                <div
                  className="flex items-center justify-center mb-5 rounded-2xl"
                  style={{
                    width: 44,
                    height: 44,
                    background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                    color: "var(--accent)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {s.n}
                </div>
                <p className="text-lg font-medium text-ink mb-2 tracking-tight">{s.title}</p>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR TECHNICIANS */}
      <section id="pricing" className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
          <p className="eyebrow mb-6 reveal">For technicians</p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <h2 className="display text-4xl sm:text-5xl tracking-tighter max-w-2xl reveal delay-1">
              Free to join. 10% commission per completed job.
            </h2>
            <p className="text-muted max-w-md text-sm leading-relaxed reveal delay-2">
              No monthly fees. No upfront cost. You only pay when you get paid. The
              customer pays you directly, and you remit the 10% to FixLink after each
              completed job.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            <PriceCard
              eyebrow="Free to join"
              big="₱0 upfront"
              body="Sign up, get verified, list your services. No credit card. No commitment."
            />
            <PriceCard
              eyebrow="Commission"
              big="10% per job"
              body="Charged only on completed jobs, on the final approved price. If you don't get paid, FixLink doesn't either."
            />
          </div>

          {/* Example */}
          <div className="card p-6 sm:p-8 mt-8 max-w-2xl reveal">
            <p className="eyebrow mb-5">Example</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Customer approves final price</span>
                <span className="text-ink font-medium">₱1,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">FixLink commission (10%)</span>
                <span className="text-ink">₱100</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-line">
                <span className="text-muted">Technician keeps</span>
                <span className="text-ink font-semibold text-base">₱900</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — different ask from hero */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 text-center">
          <p className="eyebrow reveal justify-center mb-6" style={{ display: "inline-flex" }}>
            Ready to start?
          </p>
          <h2 className="display text-4xl sm:text-6xl tracking-tighter mb-8 reveal delay-1">
            Browse verified technicians near you.
          </h2>
          <div className="flex flex-wrap gap-3 justify-center reveal delay-2">
            <Link href="/register" className="btn-primary">Create a customer account</Link>
            <Link href="/help" className="btn-secondary">Read the FAQ</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-sm text-muted">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row justify-between gap-4 border-t border-line">
          <p>FixLink — 2026</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/about" className="hover:text-ink transition">About</Link>
            <Link href="/help" className="hover:text-ink transition">Help</Link>
            <Link href="/terms" className="hover:text-ink transition">Terms</Link>
            <Link href="/privacy" className="hover:text-ink transition">Privacy</Link>
            <Link href="/login" className="hover:text-ink transition">Log in</Link>
            <Link href="/register" className="hover:text-ink transition">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PriceCard({
  eyebrow,
  big,
  body,
}: {
  eyebrow: string
  big: string
  body: string
}) {
  return (
    <div className="card p-6 hover-lift reveal">
      <p className="text-[11px] uppercase tracking-wider text-muted font-medium mb-3">
        {eyebrow}
      </p>
      <p className="display text-2xl font-semibold tracking-tight text-ink mb-3">
        {big}
      </p>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  )
}