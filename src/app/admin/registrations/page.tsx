import { createClient } from "@/lib/supabase/server"
import { VerifyButtons } from "@/components/admin/verify-buttons"
import { DocThumb } from "@/components/admin/doc-thumb"
import { CopyValue } from "@/components/admin/copy-value"
import { NearbyMap } from "@/components/booking/NearbyMap"
import { HistorySection } from "./history-section"
import type { HistoryRow } from "./history-modal"

const TESDA_URL = "https://www.tesda.gov.ph/RWAC"

export default async function AdminRegistrationsPage() {
  const supabase = await createClient()

  const [pendingCustomersRes, pendingTechsRes, eventsRes] = await Promise.all([
    supabase.from("profiles")
      .select("id, full_name, first_name, last_name, email, phone, created_at, id_front_url, id_back_url, selfie_url, verification_status")
      .eq("role", "customer").eq("verification_status", "pending")
      .order("created_at", { ascending: false }),
    supabase.from("technician_profiles")
      .select("id, cert_number, cert_trade, cert_file_url, cert_status, cert_submitted_at, cert_rejection_reason, cert_reviewed_at, home_region, home_province, home_barangay, home_city, service_address, home_lat, home_lng")
      .eq("cert_status", "pending")
      .order("cert_submitted_at", { ascending: false }),
    supabase.from("registration_events")
      .select("id, user_id, kind, decision, reason, created_at, user_name, user_email")
      .order("created_at", { ascending: false })
      .limit(300),
  ])

  const pendingCustomers = pendingCustomersRes.data ?? []
  const pendingTechsRaw = pendingTechsRes.data ?? []
  const events = eventsRes.data ?? []

  // Grab all users referenced in the events (techs + customers)
  const userIds = [...new Set(events.map((e: any) => e.user_id).filter(Boolean))]
  const { data: eventProfiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, phone, id_front_url, id_back_url, selfie_url")
        .in("id", userIds)
    : { data: [] as any[] }
  const { data: eventTechs } = userIds.length
    ? await supabase
        .from("technician_profiles")
        .select("id, cert_number, cert_trade, cert_file_url, home_barangay, home_city, service_address, home_lat, home_lng")
        .in("id", userIds)
    : { data: [] as any[] }

  const profileById = new Map((eventProfiles ?? []).map((p: any) => [p.id, p]))
  const techById = new Map((eventTechs ?? []).map((t: any) => [t.id, t]))

  const historyRows: HistoryRow[] = events.map((e: any) => {
    const p = profileById.get(e.user_id) || {}
    const t = techById.get(e.user_id) || {}
    return {
      id: e.id,
      userId: e.user_id,
      kind: e.kind,
      name: p.full_name || e.user_name || "Deleted user",
      email: p.email || e.user_email || "",
      phone: p.phone || null,
      status: e.decision,
      reviewedAt: e.created_at,
      reason: e.reason,
      certNumber: t.cert_number || null,
      certTrade: t.cert_trade || null,
      certFileUrl: t.cert_file_url || null,
      idFrontUrl: p.id_front_url || null,
      idBackUrl: p.id_back_url || null,
      selfieUrl: p.selfie_url || null,
      homeCity: t.home_city || null,
      homeBarangay: t.home_barangay || null,
      serviceAddress: t.service_address || null,
      homeLat: t.home_lat ?? null,
      homeLng: t.home_lng ?? null,
    }
  })

  const totalPending = pendingCustomers.length + pendingTechsRaw.length

  // For pending tech cards we still need profile info
  const pendingTechIds = pendingTechsRaw.map((t: any) => t.id)
  const { data: pendingTechProfiles } = pendingTechIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, phone, id_front_url, id_back_url, selfie_url")
        .in("id", pendingTechIds)
    : { data: [] as any[] }
  const pendingTechById = new Map((pendingTechProfiles ?? []).map((p: any) => [p.id, p]))
  const pendingTechs = pendingTechsRaw.map((t: any) => ({ ...t, profile: pendingTechById.get(t.id) }))

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-ink tracking-tight">Registrations</h1>
      <p className="text-muted text-sm mb-6">New signups awaiting review. Verify identity documents before approving.</p>

      <div className="card p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink mb-0.5">Verify TESDA certificate</p>
            <p className="text-xs text-muted leading-relaxed">
              Open the registry, then tap the copy icon next to each value to copy it individually.
            </p>
          </div>
          <a href={TESDA_URL} target="_blank" rel="noreferrer"
             className="btn-secondary text-sm py-2 px-4 shrink-0 self-start sm:self-auto">
            Open TESDA registry ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        <Stat label="Total pending" value={totalPending} />
        <Stat label="Customers" value={pendingCustomers.length} />
        <Stat label="Technicians" value={pendingTechsRaw.length} />
      </div>

      {totalPending === 0 && (
        <div className="card p-8 sm:p-12 text-center mb-10">
          <p className="text-sm text-ink font-medium mb-1">All caught up</p>
          <p className="text-xs text-muted">No registrations waiting for review.</p>
        </div>
      )}

      {pendingTechs.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
            Technicians — pending ({pendingTechs.length})
          </h2>
          <div className="space-y-4">
            {pendingTechs.map((t: any) => <PendingCard key={t.id} kind="technician" data={t} />)}
          </div>
        </section>
      )}

      {pendingCustomers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
            Customers — pending ({pendingCustomers.length})
          </h2>
          <div className="space-y-4">
            {pendingCustomers.map((c: any) => <PendingCard key={c.id} kind="customer" data={c} />)}
          </div>
        </section>
      )}

      <HistorySection rows={historyRows} />
    </div>
  )
}

function PendingCard({ kind, data }: { kind: "technician" | "customer"; data: any }) {
  const p = kind === "technician" ? (data.profile || {}) : data
  const status = kind === "technician" ? data.cert_status : data.verification_status
  const certNumber: string = (data.cert_number || "").trim()
  const certFirst4 = certNumber ? certNumber.slice(0, 4) : ""
  const certLast4  = certNumber ? certNumber.slice(-4) : ""

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base sm:text-lg font-semibold text-ink truncate">{p.full_name || "Unnamed"}</h3>
            <span className={`badge ${kind === "technician" ? "badge-info" : "badge-completed"}`}>{kind}</span>
          </div>
          <p className="text-xs text-muted mb-4 break-all">{p.email || "—"} · {p.phone || "no phone"}</p>

          {kind === "technician" && (
            <div className="rounded-lg border border-line p-3 sm:p-4 mb-4 bg-surface-2/40">
              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-3">
                Copy each field for the TESDA search
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Last name" value={p.last_name || ""} />
                <Field label="First name" value={p.first_name || ""} />
                <Field label="Cert first 4" value={certFirst4} mono />
                <Field label="Cert last 4" value={certLast4} mono />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">
            {kind === "technician" && (
              <>
                <DetailRow label="Trade" value={data.cert_trade || "—"} />
                <DetailRow label="Cert #" value={data.cert_number || "—"} mono />
                <DetailRow label="Region" value={data.home_region || "—"} />
                <DetailRow label="Province" value={data.home_province || "—"} />
                <DetailRow label="City" value={data.home_city || "—"} />
                <DetailRow label="Barangay" value={data.home_barangay || "—"} />
                <DetailRow label="Address" value={data.service_address || "—"} />
                <DetailRow label="Submitted" value={data.cert_submitted_at ? new Date(data.cert_submitted_at).toLocaleString() : "—"} />
              </>
            )}
            {kind === "customer" && (
              <DetailRow label="Signed up" value={p.created_at ? new Date(p.created_at).toLocaleString() : "—"} />
            )}
          </div>

          {kind === "technician" && data.home_lat != null && data.home_lng != null && (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
                Registered location
              </p>
              <NearbyMap
                meLat={null}
                meLng={null}
                focusId={data.id}
                height={260}
                techs={[
                  {
                    id: data.id,
                    lat: data.home_lat,
                    lng: data.home_lng,
                    name: p.full_name || "Technician",
                    isSelected: true,
                    certified: false,
                  },
                ]}
              />
            </div>
          )}

          <div className="mt-5">
            <VerifyButtons id={data.id} currentStatus={status} mode={kind}
              existingReason={kind === "technician" ? data.cert_rejection_reason : null} large />
          </div>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3 lg:w-[280px] shrink-0">
          {kind === "technician" && <DocThumb label="NC2 cert" url={data.cert_file_url} />}
          <DocThumb label="ID front" url={p.id_front_url} />
          <DocThumb label="ID back" url={p.id_back_url} />
          <DocThumb label="Selfie" url={p.selfie_url} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">{label}</p>
      <CopyValue value={value} label={label} mono={mono} />
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted text-xs">{label}</span>
      <span className={`text-ink text-right truncate text-xs ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-3 sm:p-5">
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted font-medium mb-1 sm:mb-2">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">{value}</p>
    </div>
  )
}