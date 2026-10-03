import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ResubmitForm } from "./resubmit-form"
import { CustomerResubmitForm } from "./customer-resubmit-form"

export default async function RegistrationStatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, full_name, email, role, id_front_url, id_back_url, selfie_url, verification_status")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")
  if (profile.role === "admin") redirect("/admin")

  const firstName = profile.first_name || "there"

  // ---------- CUSTOMER ----------
  if (profile.role === "customer") {
    const status = profile.verification_status || "unverified"
    if (status === "verified") redirect("/app")

    return (
      <div className="min-h-screen bg-paper py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="display text-lg font-semibold block text-center mb-8 text-ink tracking-tight">
            FixLink
          </Link>

          {status === "pending" && (
            <div className="card p-6 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "color-mix(in srgb, var(--warn) 15%, transparent)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-ink tracking-tight mb-2">Account under review</h1>
              <p className="text-sm text-muted leading-relaxed">
                Thanks, {firstName}. We&apos;re verifying your identity documents. This usually takes a few hours.
                We&apos;ll email you when there&apos;s an update.
              </p>
            </div>
          )}

          {status === "rejected" && (
            <div className="space-y-4">
              <div className="card p-6 sm:p-8">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                     style={{ background: "color-mix(in srgb, var(--danger) 15%, transparent)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-ink tracking-tight mb-2 text-center">Account needs attention</h1>
                <p className="text-sm text-muted leading-relaxed text-center mb-6">
                  Hi {firstName}, we couldn&apos;t verify your identity yet. See the reason below and resubmit.
                </p>
              </div>
              <CustomerResubmitForm />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------- TECHNICIAN ----------
  const { data: tech } = await supabase
    .from("technician_profiles")
    .select("cert_number, cert_trade, cert_file_url, cert_status, cert_rejection_reason, cert_submitted_at, home_region, home_province, home_barangay, home_city, service_address, home_lat, home_lng")
    .eq("id", user.id)
    .single()

  const { data: serviceRows } = await supabase
    .from("technician_services")
    .select("service")
    .eq("technician_id", user.id)
  const existingServices = (serviceRows ?? []).map((r: any) => r.service)

  const status = tech?.cert_status || "pending"
  if (status === "verified") redirect("/tech")

  return (
    <div className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="display text-lg font-semibold block text-center mb-8 text-ink tracking-tight">
          FixLink
        </Link>

        {status === "pending" && (
          <div className="card p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                 style={{ background: "color-mix(in srgb, var(--warn) 15%, transparent)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight mb-2">Application under review</h1>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Thanks, {firstName}. We&apos;re reviewing your documents. This usually takes 1–2 business days.
              We&apos;ll email you when there&apos;s an update.
            </p>
            <div className="rounded-lg bg-surface-2 p-4 text-left">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">What you submitted</p>
              <div className="space-y-1.5 text-xs">
                <Row label="Certificate #" value={tech?.cert_number || "—"} />
                <Row label="Trade" value={tech?.cert_trade || "—"} />
                <Row label="Submitted" value={tech?.cert_submitted_at ? new Date(tech.cert_submitted_at).toLocaleString() : "—"} />
              </div>
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div className="space-y-4">
            <div className="card p-6 sm:p-8">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "color-mix(in srgb, var(--danger) 15%, transparent)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-ink tracking-tight mb-2 text-center">Application needs attention</h1>
              <p className="text-sm text-muted leading-relaxed text-center mb-6">
                Hi {firstName}, we couldn&apos;t verify your application yet. See the reason below and resubmit.
              </p>
              <div className="rounded-lg p-4"
                   style={{ background: "color-mix(in srgb, var(--warn) 10%, transparent)", borderLeft: "3px solid var(--warn)" }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--warn)" }}>Reason</p>
                <p className="text-sm text-ink leading-relaxed">
                  {tech?.cert_rejection_reason || "Documents could not be verified."}
                </p>
              </div>
            </div>
            <ResubmitForm
              defaultCertNumber={tech?.cert_number || ""}
              defaultCertTrade={tech?.cert_trade || ""}
              defaultCity={tech?.home_city || ""}
              defaultRegion={tech?.home_region || ""}
              defaultProvince={tech?.home_province || ""}
              defaultBarangay={tech?.home_barangay || ""}
              defaultAddress={tech?.service_address || ""}
              defaultServices={existingServices}
              defaultLat={tech?.home_lat ?? null}
              defaultLng={tech?.home_lng ?? null}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`text-ink text-right truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}