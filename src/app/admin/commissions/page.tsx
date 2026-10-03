import { createClient } from "@/lib/supabase/server"

export default async function AdminCommissionsPage() {
  const supabase = await createClient()

  const { data: commissions } = await supabase
    .from("commissions")
    .select(`
      id, booking_id, commission, status, created_at,
      technician:profiles!commissions_technician_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })

  const rows = commissions ?? []
  const total = rows.reduce((s: number, c: any) => s + Number(c.commission || 0), 0)
  const owed = rows.filter((c: any) => c.status === "owed").reduce((s: number, c: any) => s + Number(c.commission || 0), 0)
  const paid = rows.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.commission || 0), 0)

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold mb-2 text-ink tracking-tight">Commissions</h1>
      <p className="text-muted mb-8">10% of every completed job&apos;s final approved price.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={`₱${total.toLocaleString()}`} />
        <Stat label="Paid" value={`₱${paid.toLocaleString()}`} color="var(--success)" />
        <Stat label="Owed" value={`₱${owed.toLocaleString()}`} color="var(--warn)" />
        <Stat label="Rate" value="10%" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="p-4 font-medium">Technician</th>
              <th className="p-4 font-medium">Booking</th>
              <th className="p-4 font-medium">Commission</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((c: any) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-4 text-ink font-medium">{c.technician?.full_name || "—"}</td>
                <td className="p-4 text-muted font-mono text-xs">{String(c.booking_id).slice(0, 8)}</td>
                <td className="p-4 text-ink font-semibold">₱{Number(c.commission).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`badge ${c.status === "paid" ? "badge-active" : "badge-pending"}`}>{c.status}</span>
                </td>
                <td className="p-4 text-muted">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            )) : (
              <tr><td className="p-8 text-muted text-center" colSpan={5}>No commissions recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">{label}</p>
      <p className="text-2xl font-semibold tracking-tight" style={{ color: color || "var(--ink)" }}>{value}</p>
    </div>
  )
}