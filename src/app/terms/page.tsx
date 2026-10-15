import Link from "next/link"
import { SiteName } from "@/components/shared/SiteNameProvider"
import { createClient } from "@/lib/supabase/server"

const FALLBACK_NAME = "FixLink"

async function getSiteName(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("app_settings")
      .select("site_name")
      .eq("id", 1)
      .maybeSingle()
    return data?.site_name || FALLBACK_NAME
  } catch {
    return FALLBACK_NAME
  }
}

export async function generateMetadata() {
  const name = await getSiteName()
  return {
    title: `Terms of Service — ${name}`,
    description: `Terms governing use of the ${name} appliance repair platform.`,
  }
}

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-paper">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="display text-lg font-semibold text-ink tracking-tight"><SiteName /></Link>
          <Link href="/register" className="text-sm text-accent font-medium hover:underline">Back to sign up</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-3">Terms of Service</h1>
        <p className="text-sm text-muted mb-10">Last updated: 2 October 2026</p>

        <Section title={<>1. What <SiteName /> is</>}>
          <p><SiteName /> is an online marketplace that connects customers in the Philippines with independent, verified appliance-repair technicians. We do not perform repairs ourselves. We provide the platform that lets you describe a problem, request estimates, compare technicians, and track the job.</p>
        </Section>

        <Section title="2. Your account">
          <p>You must provide accurate information when creating an account. Customers must submit a valid government-issued ID and a selfie holding that ID for identity verification. Technicians must additionally submit a TESDA National Certificate II (NC2) or an equivalent manufacturer certification in their trade.</p>
          <p>You are responsible for keeping your password confidential and for all activity under your account. Accounts may be suspended or rejected if submitted documents are invalid, altered, or fail verification.</p>
        </Section>

        <Section title="3. Payments and commission">
          <p>Customers pay technicians <strong>directly</strong> in cash or via GCash at the end of the job. <SiteName /> does not hold, escrow, or process payments.</p>
          <p><SiteName /> charges technicians a <strong>10% commission</strong> on the final approved price of each completed job. This commission is remitted by the technician after receiving payment from the customer. Failure to remit commission may result in account suspension.</p>
        </Section>

        <Section title="4. Pricing stages">
          <p>Three prices appear during a booking:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Estimated</strong> — a pre-inspection guess. Not binding.</li>
            <li><strong>Quotation</strong> — the formal price after the technician inspects the appliance. Itemized. Must be approved by the customer before work begins.</li>
            <li><strong>Final</strong> — the amount approved and paid. Once approved, that is the agreed price.</li>
          </ul>
        </Section>

        <Section title="5. Disputes">
          <p>If a job is not completed as agreed, you may file a dispute through your booking page within 14 days of completion. <SiteName /> admin will review both sides and may issue a refund, a warning, or dismiss the dispute. Our decision is final for the purposes of this platform.</p>
        </Section>

        <Section title="6. Limitation of liability">
          <p><SiteName /> does not guarantee any repair outcome. We verify the identity and certification of technicians but are not responsible for the quality, timeliness, or safety of any work performed. Any legal claim arising from a repair is between you and the technician.</p>
        </Section>

        <Section title="7. Changes to these terms">
          <p>We may update these terms from time to time. Continued use of <SiteName /> after changes means you accept the updated terms.</p>
        </Section>

        <Section title="8. Contact">
          <p>Questions? Email <a href="mailto:support@gmail.com" className="text-accent hover:underline">support@gmail.com</a>.</p>
        </Section>

        <div className="mt-12 pt-8 border-t border-line flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-accent font-medium hover:underline">Privacy Policy →</Link>
          <Link href="/about" className="text-muted hover:text-ink">About</Link>
          <Link href="/register" className="text-muted hover:text-ink">Back to sign up</Link>
        </div>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-ink mb-3 tracking-tight">{title}</h2>
      <div className="text-[15px] leading-relaxed text-ink/90 space-y-3 [&_ul]:text-ink/90">
        {children}
      </div>
    </section>
  )
}