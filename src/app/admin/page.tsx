import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [profilesRes, techRes, bookings, pendingTechs, commissions, recent] = await Promise.all([
    supabase.from("profiles").select("id, role, verification_status"),
    supabase.from("technician_profiles").select("id, cert_status"),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("technician_profiles").select("*", { count: "exact", head: true }).eq("cert_status", "pending"),
    supabase.from("commissions").select("commission, status"),
    supabase.from("bookings")
      .select("id, status, scheduled_date, final_amount, service, customer:profiles!bookings_customer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const profiles = profilesRes.data ?? []
  const techs = techRes.data ?? []
  const techById = new Map(techs.map((t: any) => [t.id, t]))

  // Approved accounts only — matches /admin/users filter
  const approvedCount = profiles.filter((p: any) => {
    if (p.role === "admin") return true
    if (p.role === "customer") return p.verification_status === "verified"
    if (p.role === "technician") return techById.get(p.id)?.cert_status === "verified"
    return false
  }).length

  const verifiedTechCount = techs.filter((t: any) => t.cert_status === "verified").length
  const totalTechCount = techs.length

  const users = { count: approvedCount }
  const techsObj = { count: totalTechCount }
  const verifiedTechs = { count: verifiedTechCount }

  const comms = commissions.data ?? []
  const totalCommission = comms.reduce((s: number, c: any) => s + Number(c.commission || 0), 0)
  const owed = comms.filter((c: any) => c.status === "owed").reduce((s: number, c: any) => s + Number(c.commission || 0), 0)
  const paid = comms.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.commission || 0), 0)
  const bookingsList = recent.data ?? []

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold mb-8 text-ink tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Users" value={users.count ?? 0} />
        <Stat label="Technicians" value={`${verifiedTechs.count ?? 0} / ${techs.count ?? 0}`} hint="verified / total" />
        <Stat label="Bookings" value={bookings.count ?? 0} />
        <Stat label="Commission" value={`₱${totalCommission.toLocaleString()}`} hint="all-time" />
      </div>

      {(pendingTechs.count ?? 0) > 0 && (
        <Link
          href="/admin/technicians"
          className="card p-5 mb-6 flex items-center justify-between gap-4 hover:bg-surface-2 transition"
          style={{ borderLeft: "3px solid var(--warn)" }}
        >
          <div>
            <p className="text-sm font-medium text-ink">
              {pendingTechs.count} technician{pendingTechs.count === 1 ? "" : "s"} awaiting verification
            </p>
            <p className="text-xs text-muted mt-0.5">Review certificates and ID documents.</p>
          </div>
          <span className="text-accent text-sm font-medium">Review →</span>
        </Link>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Recent bookings</h2>
          <div className="divide-y divide-line">
            {bookingsList.length ? bookingsList.map((b: any) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{b.customer?.full_name || "Customer"}</p>
                  <p className="text-xs text-muted mt-0.5">{b.service || "—"} · {b.scheduled_date || "—"}</p>
                </div>
                <span className="badge badge-completed shrink-0">{b.status}</span>
              </div>
            )) : <p className="text-sm text-muted py-3">No bookings yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Commission (10%)</h2>
          <div className="space-y-3 text-sm">
            <Row label="Total earned" value={`₱${totalCommission.toLocaleString()}`} />
            <Row label="Paid" value={`₱${paid.toLocaleString()}`} accent />
            <Row label="Owed by techs" value={`₱${owed.toLocaleString()}`} warn />
          </div>
          <p className="text-xs text-muted mt-5 leading-relaxed">
            Customers pay technicians directly. FixLink charges 10% of the final approved price — remitted by the technician after each job.
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">{label}</p>
      <p className="text-3xl font-semibold text-ink tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  )
}

function Row({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  const color = accent ? "var(--success)" : warn ? "var(--warn)" : "var(--ink)"
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium" style={{ color }}>{value}</span>
    </div>
  )
}