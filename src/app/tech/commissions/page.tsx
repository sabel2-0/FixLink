import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { peso } from "@/lib/format"

export default async function TechCommissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from("commissions")
    .select("id, booking_id, final_amount, rate, commission, status, created_at, paid_at")
    .eq("technician_id", user.id)
    .order("created_at", { ascending: false })

  const list = rows || []
  const total = list.reduce((s, c) => s + Number(c.commission || 0), 0)
  const owed = list.filter((c) => c.status === "owed").reduce((s, c) => s + Number(c.commission || 0), 0)
  const paid = list.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission || 0), 0)

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Commissions</h1>
      <p className="text-muted mb-6">10% of each completed job. Remit to FixLink after the customer pays you.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Total</p>
          <p className="text-2xl font-semibold tracking-tight">{peso(total)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Owed</p>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--warn)" }}>{peso(owed)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Paid</p>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--success)" }}>{peso(paid)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="p-4 font-medium">Booking</th>
              <th className="p-4 font-medium">Final</th>
              <th className="p-4 font-medium">Commission</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No commission records yet.</td></tr>
            ) : list.map((c: any) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-4 text-muted">#{String(c.booking_id).slice(0, 8)}</td>
                <td className="p-4">{peso(c.final_amount)}</td>
                <td className="p-4 font-medium">{peso(c.commission)}</td>
                <td className="p-4"><Badge status={c.status === "owed" ? "Owed" : "Paid"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}