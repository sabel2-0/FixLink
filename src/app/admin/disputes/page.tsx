import { createClient } from "@/lib/supabase/server"

export default async function AdminDisputesPage() {
  const supabase = await createClient()

  const { data: disputes } = await supabase
    .from("disputes")
    .select(`
      id, reason, status, created_at, resolution,
      booking:bookings!disputes_booking_id_fkey(id, status),
      customer:profiles!disputes_customer_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })

  const rows = disputes ?? []

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold mb-2 text-ink tracking-tight">Disputes</h1>
      <p className="text-muted mb-8">Customer complaints against technicians.</p>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((d: any) => (
            <div key={d.id} className="card p-6">
              <div className="flex items-center justify-between mb-2 gap-3">
                <p className="text-sm font-medium text-ink">
                  {d.customer?.full_name || "Customer"} — {d.reason || "no reason"}
                </p>
                <span className={`badge ${d.status === "resolved" ? "badge-active" : "badge-warn"}`}>{d.status}</span>
              </div>
              <p className="text-xs text-muted mb-2">
                Booking {String(d.booking?.id || "").slice(0, 8)} · {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
              </p>
              {d.resolution && <p className="text-sm text-[var(--success)]">Resolution: {d.resolution}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-muted">No disputes filed yet.</div>
      )}
    </div>
  )
}