import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { peso } from "@/lib/format"

export default async function TechEarnings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: done } = await supabase
    .from("bookings")
    .select("id, scheduled_date, final_amount, final_commission, paid_at, payment_confirmed_at, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service)")
    .eq("technician_id", user.id)
    .eq("status", "completed")
    .order("scheduled_date", { ascending: false })

  const { data: commissions } = await supabase
    .from("commissions")
    .select("id, booking_id, commission, status")
    .eq("technician_id", user.id)

  const list = done || []
  const comms = commissions || []

  const jobsDone = list.length
  const grossEarned = list.reduce((s, b: any) => s + Number(b.final_amount || 0), 0)
  const collected = list.filter((b: any) => b.paid_at).reduce((s, b: any) => s + Number(b.final_amount || 0), 0)
  const awaitingPayment = list.filter((b: any) => !b.paid_at).reduce((s, b: any) => s + Number(b.final_amount || 0), 0)

  const commissionOwed = comms.filter((c: any) => c.status === "owed").reduce((s, c: any) => s + Number(c.commission || 0), 0)
  const commissionPaid = comms.filter((c: any) => c.status === "paid").reduce((s, c: any) => s + Number(c.commission || 0), 0)

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Earnings</h1>
      <p className="text-muted mb-6">You collect directly from customers. FixLink takes 10% of the final price.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Jobs done</p>
          <p className="text-3xl font-semibold tracking-tight">{jobsDone}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Gross earned</p>
          <p className="text-3xl font-semibold tracking-tight">{peso(grossEarned)}</p>
          <p className="text-xs text-muted mt-1">Total from completed jobs</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Collected</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: "var(--success)" }}>{peso(collected)}</p>
          <p className="text-xs text-muted mt-1">Customer has paid</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Awaiting payment</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: awaitingPayment > 0 ? "var(--warn)" : "var(--muted)" }}>{peso(awaitingPayment)}</p>
          <p className="text-xs text-muted mt-1">Jobs done, not yet paid</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Commission owed to FixLink</p>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--warn)" }}>{peso(commissionOwed)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Commission paid</p>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--success)" }}>{peso(commissionPaid)}</p>
        </div>
      </div>

      <div className="card p-6 mb-4">
        <p className="text-sm font-medium mb-1">You collect directly from customers</p>
        <p className="text-xs text-muted leading-relaxed">
          Cash or GCash at the door. FixLink never touches the money. You keep 90% of the final approved price and remit 10% to FixLink after each completed job.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Service</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Final</th>
              <th className="p-4 font-medium">Net</th>
              <th className="p-4 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No completed jobs yet.</td></tr>
            ) : list.map((b: any) => {
              const paid = !!b.paid_at
              const confirmed = !!b.payment_confirmed_at
              return (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium">{b.customer?.full_name || "Customer"}</td>
                  <td className="p-4">{(b.booking_items || []).map((i: any) => i.service).join(", ")}</td>
                  <td className="p-4 text-muted">{b.scheduled_date}</td>
                  <td className="p-4 font-medium">{peso(b.final_amount)}</td>
                  <td className="p-4" style={{ color: "var(--success)" }}>{peso(Number(b.final_amount || 0) - Number(b.final_commission || 0))}</td>
                  <td className="p-4">
                    {!paid ? (
                      <span className="badge badge-pending">Not paid</span>
                    ) : !confirmed ? (
                      <span className="badge badge-warn">Paid, unverified</span>
                    ) : (
                      <span className="badge badge-active"><span aria-hidden>✓</span> Verified</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}