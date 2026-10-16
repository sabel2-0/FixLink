"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteName } from "@/components/shared/SiteNameProvider"

type FAQ = { q: string; a: React.ReactNode; cat: "customer" | "technician" | "account" }

const FAQS: FAQ[] = [
  {
    cat: "customer",
    q: "How do I book a repair?",
    a: (<>
      Go to <strong>Book a service</strong> from your dashboard. Pick the appliance(s),
      describe the symptoms, verify your location, choose a date and time, then select
      one or more technicians. Each technician will send you their own estimate —
      you pick the one you like best.
    </>),
  },
  {
    cat: "customer",
    q: "Why do I see three different prices?",
    a: (<>
      <strong>Estimated</strong> is a pre-inspection guess used to compare technicians.
      {" "}<strong>Quotation</strong> is the itemized price after the technician inspects
      the appliance on-site. <strong>Final</strong> is what you approve and pay. Only the
      Final price is binding.
    </>),
  },
  {
    cat: "customer",
    q: "How do I pay?",
    a: (<>
      You pay the technician <strong>directly</strong> in cash, GCash, or Maya at the
      end of the job. The technician shows their GCash/Maya details (or a QR code) right
      in the booking. After you pay, tap <strong>Record payment</strong> so both sides
      have it on file, and the technician confirms receipt. <SiteName /> never touches
      your money.
    </>),
  },
  {
    cat: "customer",
    q: "What if the technician doesn't show up?",
    a: (<>
      Open the booking and file a dispute within 14 days. Admin reviews both sides and
      may issue a refund, warn the technician, or dismiss the case.
    </>),
  },

  {
    cat: "technician",
    q: "What are the ways I can get verified?",
    a: (<>
      You can qualify through any of these (combine as many as apply):
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>TESDA NC2</strong> — cert number, trade, and a photo of the certificate.</li>
        <li><strong>Employed / Former</strong> — employer, position, and a Certificate of Employment.</li>
        <li><strong>Self-employed</strong> — DTI registration, BIR 2303, or a Mayor&apos;s permit (any one).</li>
        <li><strong>Freelance</strong> — Facebook page (6+ months old, 10+ reviews) plus 3 customer references.</li>
      </ul>
      A bachelor&apos;s degree alone doesn&apos;t qualify — the certificates and documents above do.
    </>),
  },
  {
    cat: "technician",
    q: "How long does verification take?",
    a: (<>
      Usually <strong>1–2 business days</strong>. We review the documents you
      submitted along with your government ID and selfie. You&apos;ll get an email when
      the review is done.
    </>),
  },
  {
    cat: "technician",
    q: "What if my application is rejected?",
    a: (<>
      You&apos;ll receive an email explaining the reason. Log in to <SiteName /> — you&apos;ll
      be taken to a status page where you can <strong>resubmit clearer documents</strong>.
      There is no limit on resubmissions.
    </>),
  },
  {
    cat: "technician",
    q: "How does the wallet work?",
    a: (<>
      Your wallet is a prepaid balance that covers the platform&apos;s <strong>10% commission</strong>.
      Every time you mark a job as <strong>completed</strong>, 10% of the final amount
      is automatically deducted from your wallet. You don&apos;t need to click anything —
      the deduction happens the moment the job closes.
      <br /><br />
      Keep a positive balance. If your balance drops below the minimum threshold
      (₱100 by default), you&apos;ll be hidden from new customer searches until
      you top up.
    </>),
  },
  {
    cat: "technician",
    q: "How do I top up my wallet?",
    a: (<>
      Go to <strong>Wallet</strong> in your dashboard. Send the amount via GCash or Maya
      to the account shown, then submit the reference number. An admin confirms it and
      your balance is credited. Top-ups are usually reviewed the same day.
    </>),
  },
  {
    cat: "technician",
    q: "What happens if my wallet goes negative?",
    a: (<>
      You owe that amount to <SiteName />. You&apos;ll be hidden from new customer
      searches until you top up. You can still finish jobs you&apos;re already assigned
      to. See the exact balance owed on your <strong>Earnings</strong> page.
    </>),
  },
  {
    cat: "technician",
    q: "Can I choose which barangays I serve?",
    a: (<>
      Yes. When you register (or resubmit), select your home <strong>region →
      province → city → barangay</strong> and turn on
      <strong>Use my current location</strong>. Only jobs within a short distance will
      be shown to you.
    </>),
  },

  {
    cat: "account",
    q: "I didn't receive the email verification code.",
    a: (<>
      Check your spam folder first. If still nothing, wait 10 minutes — email providers
      rate-limit new senders. If you never get it, email{" "}
      <a href="mailto:support@gmail.com" className="text-accent hover:underline">support@gmail.com</a>.
    </>),
  },
  {
    cat: "account",
    q: "How do I delete my account?",
    a: (<>
      Email <a href="mailto:support@gmail.com" className="text-accent hover:underline">support@gmail.com</a> with
      the subject &ldquo;Delete my account&rdquo;. We&apos;ll remove your profile,
      verification documents, and booking history within 30 days.
    </>),
  },
  {
    cat: "account",
    q: "I forgot my password.",
    a: (<>
      On the login page, click <strong>Forgot?</strong> and follow the reset link sent
      to your email. If you don&rsquo;t receive it, contact{" "}
      <a href="mailto:support@gmail.com" className="text-accent hover:underline">support@gmail.com</a>.
    </>),
  },
]

const CATEGORIES: Array<{ key: "all" | "customer" | "technician" | "account"; label: string }> = [
  { key: "all", label: "All" },
  { key: "customer", label: "For customers" },
  { key: "technician", label: "For technicians" },
  { key: "account", label: "Account & privacy" },
]

export default function HelpPage() {
  const [cat, setCat] = useState<"all" | "customer" | "technician" | "account">("all")
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const filtered = cat === "all" ? FAQS : FAQS.filter((f) => f.cat === cat)

  return (
    <main className="min-h-dvh bg-paper">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="display text-lg font-semibold text-ink tracking-tight"><SiteName /></Link>
          <Link href="/" className="text-sm text-accent font-medium hover:underline">Back to home</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-3">Help center</h1>
        <p className="text-sm text-muted mb-8">
          Answers to the most common questions. Can&apos;t find what you need? Email{" "}
          <a href="mailto:support@gmail.com" className="text-accent hover:underline">support@gmail.com</a>.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => { setCat(c.key); setOpenIdx(0) }}
              className={`chip ${cat === c.key ? "chip-active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((f, i) => {
            const isOpen = openIdx === i
            return (
              <div key={f.q} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full text-left p-4 sm:p-5 flex items-start gap-3 hover:bg-surface-2 transition"
                >
                  <span className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                    <CategoryPill cat={f.cat} />
                    <span className="text-[15px] font-medium text-ink leading-snug">{f.q}</span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className={`w-5 h-5 shrink-0 text-muted transition-transform mt-0.5 ${isOpen ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 -mt-1 text-[15px] leading-relaxed text-ink/85">
                    {f.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="card p-6 mt-10">
          <h2 className="text-base font-semibold text-ink tracking-tight mb-1">Still need help?</h2>
          <p className="text-sm text-muted mb-4">We respond within 1 business day.</p>
          <a href="mailto:support@gmail.com" className="btn-primary inline-flex">Email support</a>
        </div>

        <div className="mt-12 pt-8 border-t border-line flex flex-wrap gap-4 text-sm">
          <Link href="/about" className="text-muted hover:text-ink">About</Link>
          <Link href="/terms" className="text-muted hover:text-ink">Terms of Service</Link>
          <Link href="/privacy" className="text-muted hover:text-ink">Privacy Policy</Link>
          <Link href="/" className="text-muted hover:text-ink">Home</Link>
        </div>
      </article>
    </main>
  )
}
function CategoryPill({ cat }: { cat: "customer" | "technician" | "account" }) {
  const config = {
    customer: {
      label: "Customer",
      style: {
        background: "color-mix(in srgb, var(--accent) 15%, transparent)",
        color: "var(--accent)",
        border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
      },
    },
    technician: {
      label: "Technician",
      style: {
        background: "color-mix(in srgb, var(--warn) 15%, transparent)",
        color: "var(--warn)",
        border: "1px solid color-mix(in srgb, var(--warn) 30%, transparent)",
      },
    },
    account: {
      label: "Account",
      style: {
        background: "var(--surface-2)",
        color: "var(--muted)",
        border: "1px solid var(--line-2)",
      },
    },
  }[cat]

  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
      style={config.style}
    >
      {config.label}
    </span>
  )
}