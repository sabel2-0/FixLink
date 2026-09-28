import { createClient } from "@/lib/supabase/server"
import { peso } from "@/lib/format"

export default async function TechEarnings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: done } = await supabase
    .from("bookings")
    .select("id, scheduled_date, final_amount, final_commission, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service)")
    .eq("technician_id", user.id)
    .eq("status", "completed")
    .order("scheduled_date", { ascending: false })

  const list = done || []
  const gross = list.reduce((s, b: any) => s + Number(b.final_amount || 0), 0)
  const commission = list.reduce((s, b: any) => s + Number(b.final_commission || 0), 0)
  const net = gross - commission

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Earnings</h1>
      <p className="text-muted mb-6">You collect directly from customers. FixLink takes 10% of the final price.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Jobs done</p>
          <p className="text-3xl font-semibold tracking-tight">{list.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Gross collected</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: "var(--accent)" }}>{peso(gross)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Net after 10%</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: "var(--success)" }}>{peso(net)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Commission paid</p>
          <p className="text-3xl font-semibold tracking-tight">{peso(commission)}</p>
        </div>
      </div>

      <div className="card p-6 mb-4">
        <p className="text-sm font-medium mb-1">You collect directly from customers</p>
        <p className="text-xs text-muted leading-relaxed">
          Cash or GCash at the door. FixLink never touches the money. You keep 90% of the final approved price and remit 10% to FixLink after each completed job.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Service</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Final</th>
              <th className="p-4 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No completed jobs yet.</td></tr>
            ) : list.map((b: any) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="p-4 font-medium">{b.customer?.full_name || "Customer"}</td>
                <td className="p-4">{(b.booking_items || []).map((i: any) => i.service).join(", ")}</td>
                <td className="p-4 text-muted">{b.scheduled_date}</td>
                <td className="p-4 font-medium">{peso(b.final_amount)}</td>
                <td className="p-4" style={{ color: "var(--success)" }}>{peso(Number(b.final_amount || 0) - Number(b.final_commission || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}