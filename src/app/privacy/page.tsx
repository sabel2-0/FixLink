import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — FixLink",
  description: "How FixLink collects, uses, and protects your personal information under the Philippine Data Privacy Act of 2012 (RA 10173).",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-paper">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="display text-lg font-semibold text-ink tracking-tight">FixLink</Link>
          <Link href="/register" className="text-sm text-accent font-medium hover:underline">Back to sign up</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted mb-4">Last updated: 2 October 2026</p>
        <p className="text-sm text-muted mb-10">
          This policy is issued under the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong> and its
          Implementing Rules and Regulations.
        </p>

        <Section title="1. What we collect">
          <p>When you create an account or use FixLink, we collect:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Identity information</strong> — full name, email address, mobile number.</li>
            <li><strong>Verification documents</strong> — government-issued ID (front and back) and a selfie holding that ID.</li>
            <li><strong>Technician credentials</strong> — TESDA NC2 certificate number, trade, and a photo or PDF of the certificate.</li>
            <li><strong>Location data</strong> — the barangay, city, and (if you grant permission) GPS coordinates you provide during registration or booking.</li>
            <li><strong>Booking activity</strong> — requested services, chat messages, review text, dispute details.</li>
          </ul>
        </Section>

        <Section title="2. Why we collect it">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Verification</strong> — to confirm that a technician holds a valid certificate and that a customer is a real person.</li>
            <li><strong>Matching</strong> — to show customers technicians near them and vice versa.</li>
            <li><strong>Safety</strong> — to prevent fraud, abuse, or impersonation.</li>
            <li><strong>Support</strong> — to resolve disputes and answer questions.</li>
          </ul>
        </Section>

        <Section title="3. Who sees your data">
          <p>Verification documents (IDs, selfie, certificate) are visible <strong>only to FixLink admin</strong> for the purpose of review. Other users never see your documents.</p>
          <p>If you are a technician, your first name, barangay, city, an approximate map pin, ratings, and service offerings are visible to customers browsing for technicians. Your exact GPS coordinates are only visible to FixLink admin for verification, and to a customer only while you are actively assigned to their job (live tracking).</p>
          <p>We do not sell, rent, or share your personal information with third parties for marketing.</p>
        </Section>

        <Section title="4. Third-party services">
          <p>We use the following service providers to run FixLink:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Supabase</strong> — authentication and database hosting.</li>
            <li><strong>Cloudinary</strong> — secure document storage.</li>
            <li><strong>Brevo</strong> — transactional email delivery.</li>
            <li><strong>AWS Location Service</strong> — map tiles for technician and customer locations.</li>
          </ul>
          <p>Each provider processes data only as needed to deliver their service to us.</p>
        </Section>

        <Section title="5. How long we keep it">
          <p>Verification documents are retained for as long as your account is active, plus <strong>90 days</strong> after account deletion for dispute-resolution purposes. After that, they are permanently deleted.</p>
          <p>Booking history is retained indefinitely in anonymized form to power statistics and ratings.</p>
        </Section>

        <Section title="6. Your rights under RA 10173">
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Be informed</strong> — of what data we collect and why.</li>
            <li><strong>Access</strong> — the personal data we hold about you.</li>
            <li><strong>Correct</strong> — any inaccurate information.</li>
            <li><strong>Object</strong> — to further processing in certain situations.</li>
            <li><strong>Erasure</strong> — request deletion of your account and documents.</li>
            <li><strong>Data portability</strong> — receive a copy of your data in a common format.</li>
          </ul>
          <p>To exercise any of these, email <a href="mailto:privacy@fixlink.ph" className="text-accent hover:underline">privacy@fixlink.ph</a>.</p>
        </Section>

        <Section title="7. Security">
          <p>All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text. Verification documents are stored in a private bucket with signed, time-limited access URLs.</p>
        </Section>

        <Section title="8. Contact">
          <p>For privacy concerns or to exercise your rights, contact our Data Protection Officer at <a href="mailto:privacy@fixlink.ph" className="text-accent hover:underline">privacy@fixlink.ph</a>.</p>
        </Section>

        <div className="mt-12 pt-8 border-t border-line flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-accent font-medium hover:underline">Terms of Service →</Link>
          <Link href="/about" className="text-muted hover:text-ink">About</Link>
          <Link href="/register" className="text-muted hover:text-ink">Back to sign up</Link>
        </div>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-ink mb-3 tracking-tight">{title}</h2>
      <div className="text-[15px] leading-relaxed text-ink/90 space-y-3 [&_ul]:text-ink/90">
        {children}
      </div>
    </section>
  )
}