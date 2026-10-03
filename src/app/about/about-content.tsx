"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

const TEAM = [
  "Jinky Juban",
  "Lyzel Ron Montehermoso",
  "Jeamari Joring",
  "Shienna Rose Labang",
  "Jane Jhosem Toloreso",
]

type StackItem = {
  name: string
  /** Simple Icons slug — image loads from cdn.simpleicons.org. Empty string = text tile. */
  slug: string
  /** Brand hex WITHOUT the # */
  color: string
  /** Two-character fallback shown when slug is empty */
  fallback: string
}

const STACK: StackItem[] = [
  { name: "Next.js",             slug: "nextdotjs",   color: "FFFFFF", fallback: "N"  },
  { name: "Supabase",            slug: "supabase",    color: "3ECF8E", fallback: "S"  },
  { name: "TypeScript",          slug: "typescript",  color: "3178C6", fallback: "TS" },
  { name: "Tailwind CSS",        slug: "tailwindcss", color: "06B6D4", fallback: "T"  },
  { name: "Vercel",              slug: "vercel",      color: "FFFFFF", fallback: "▲"  },
  { name: "Cloudinary",          slug: "cloudinary",  color: "3448C5", fallback: "C"  },
  { name: "Brevo",               slug: "brevo",       color: "0B996E", fallback: "B"  },
  { name: "Amazon Web Services", slug: "",            color: "FF9900", fallback: "AWS"},
  { name: "PSGC API",            slug: "",            color: "A855F7", fallback: "PS" },
]

export function AboutContent() {
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
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
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
        @keyframes marquee-right {
          from { transform: translate3d(-50%, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        .marquee-track { display: flex; width: max-content; will-change: transform; }
        .marquee-track.left  { animation: marquee-left 55s linear infinite; }
        .marquee-track.right { animation: marquee-right 55s linear infinite; }
        .marquee-track.fast.left  { animation-duration: 42s; }
        .marquee-track.fast.right { animation-duration: 42s; }

        .marquee-item { padding: 0 2.5rem; white-space: nowrap; }
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
            radial-gradient(1200px 500px at 50% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%),
            radial-gradient(800px 400px at 80% 20%, color-mix(in srgb, #5AC8FA 12%, transparent), transparent 60%);
        }
        .text-gradient {
          background: linear-gradient(92deg, var(--ink) 0%, var(--ink) 40%, var(--accent) 100%);
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
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 landing-nav">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="display text-lg font-semibold text-ink tracking-tight">FixLink</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/help" className="text-muted hover:text-ink transition hidden sm:inline">Help</Link>
            <Link href="/login" className="text-muted hover:text-ink transition">Log in</Link>
            <Link href="/register" className="btn-nav">Get started</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative hero-glow">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <p className="eyebrow mb-8 reveal">About the project · 2026</p>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tighter mb-10 reveal delay-1">
            <span className="text-gradient">FixLink</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl leading-relaxed reveal delay-2">
            Trusted appliance repair, on demand. Verified technicians, written quotes, live tracking —
            built for the Philippines and made to scale.
          </p>
          <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 max-w-2xl reveal delay-3">
            <Stat n="10%" label="Flat commission" />
            <Stat n="1–2" label="Day verification" />
            <Stat n="0" label="Upfront cost" />
          </div>
        </div>
      </section>

      {/* TEAM MARQUEE */}
      <section className="border-y border-line py-14 sm:py-20 overflow-hidden" style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-10">
          <p className="eyebrow reveal">The team</p>
        </div>
        <div>
          <div className="marquee-track left">
            {[...TEAM, ...TEAM].map((name, i) => (
              <div key={"t" + i} className="marquee-item">
                <div className="flex items-center gap-4">
                  <span className="display text-4xl sm:text-6xl tracking-tighter text-ink" style={{ fontWeight: 600 }}>
                    {name}
                  </span>
                  <span className="hidden sm:inline-block w-2 h-2 rounded-full" style={{ background: "var(--accent)", opacity: 0.5 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACK MARQUEE */}
      <section className="border-b border-line py-14 sm:py-20 overflow-hidden" style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-10">
          <p className="eyebrow reveal">Built with</p>
        </div>
        <div>
          <div className="marquee-track right fast">
            {[...STACK, ...STACK].map((tool, i) => (
              <div key={"s" + i} className="marquee-item">
                <div className="flex items-center gap-4">
                  <span
                    className="flex items-center justify-center shrink-0 rounded-xl"
                    style={{
                      width: 56,
                      height: 56,
                      background: `color-mix(in srgb, #${tool.color} 10%, var(--surface))`,
                      border: `1px solid color-mix(in srgb, #${tool.color} 28%, var(--line-2))`,
                      padding: 12,
                    }}
                    aria-hidden
                  >
                    {tool.slug ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://cdn.simpleicons.org/${tool.slug}/${tool.color}`}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        style={{ display: "block" }}
                      />
                    ) : (
                      <span
                        style={{
                          color: `#${tool.color}`,
                          fontWeight: 700,
                          fontSize: tool.fallback.length > 2 ? 12 : 18,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {tool.fallback}
                      </span>
                    )}
                  </span>
                  <span className="text-2xl sm:text-4xl tracking-tight text-muted" style={{ fontWeight: 500 }}>
                    {tool.name}
                  </span>
                  <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--line)", opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 grid md:grid-cols-[1fr_1.6fr] gap-12 md:gap-20">
          <div>
            <p className="eyebrow reveal">What we&apos;re building</p>
          </div>
          <div className="space-y-8">
            <p className="text-2xl sm:text-3xl text-ink leading-snug tracking-tight reveal">
              A place where finding a repair technician is as easy as ordering a ride.
            </p>
            <p className="text-base sm:text-lg text-muted leading-relaxed reveal delay-1">
              Describe the problem. Compare estimates from multiple technicians. Approve a
              written quote. Watch them arrive. Rate the job. No phone calls, no
              guesswork, no haggling over price at the door.
            </p>
            <p className="text-base sm:text-lg text-muted leading-relaxed reveal delay-2">
              Every technician on FixLink is verified through TESDA NC2 documentation
              and government ID review. Customers are verified the same way.
              Trust on both sides, engineered into the product.
            </p>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 grid sm:grid-cols-3 gap-6">
          <Principle n="01" title="Verified by default" body="Every technician passes TESDA NC2 checks and identity review before accepting a single job." />
          <Principle n="02" title="Price transparency" body="Estimated, quotation, final. Three stages, all visible. Customers approve before work begins." />
          <Principle n="03" title="Built for local" body="Barangay-level matching, PH-only payment methods, nationwide coverage. Region-aware from day one." />
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 text-center">
          <p className="eyebrow reveal justify-center mb-6" style={{ display: "inline-flex" }}>Ready when you are</p>
          <h2 className="display text-4xl sm:text-6xl tracking-tighter mb-8 reveal delay-1">
            Book a technician in minutes.
          </h2>
          <div className="flex flex-wrap gap-3 justify-center reveal delay-2">
            <Link href="/register" className="btn-primary">Get started</Link>
            <Link href="/help" className="btn-secondary">How it works</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-sm text-muted">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row justify-between gap-4 border-t border-line">
          <p>FixLink — 2026</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
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

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="reveal">
      <p className="display text-3xl sm:text-5xl tracking-tighter text-ink mb-1.5" style={{ fontWeight: 600 }}>{n}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted font-medium">{label}</p>
    </div>
  )
}

function Principle({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="reveal">
      <p className="display text-xs text-muted mb-6 tracking-widest" style={{ fontWeight: 500 }}>{n}</p>
      <p className="text-lg font-medium text-ink mb-3 tracking-tight">{title}</p>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  )
}