import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { JobActions } from "@/components/tech/JobActions"
import { QuoteComposer } from "@/components/tech/QuoteComposer"
import { CompleteJobButton } from "@/components/tech/CompleteJobButton"

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
function fmtTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  return (hour % 12 === 0 ? 12 : hour % 12) + ":" + m + " " + (hour >= 12 ? "PM" : "AM")
}

export default async function TechSchedule() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: jobs } = await supabase
    .from("bookings")
    .select("id, status, scheduled_date, scheduled_time, barangay, address, final_amount, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service, problems)")
    .eq("technician_id", user.id)
    .order("scheduled_date", { ascending: true })

  const active = (jobs || []).filter((b: any) => !["completed","cancelled","disputed"].includes(b.status))
  const history = (jobs || []).filter((b: any) => ["completed","cancelled","disputed"].includes(b.status))

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Jobs</h1>
      <p className="text-muted mb-6">Active jobs and history.</p>

      <div className="card p-6 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Active ({active.length})</h2>
        {active.length === 0 ? (
          <EmptyState icon="calendar" title="No active jobs" description="Customers will pick you from your estimates." />
        ) : (
          <div className="divide-y divide-line">
            {active.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const problems = (b.booking_items || []).flatMap((i: any) => i.problems || [])
              return (
                <div key={b.id} className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{b.customer?.full_name || "Customer"}</p>
                    <p className="text-xs text-muted mt-0.5">{services}</p>
                    {problems.length > 0 && <p className="text-xs text-muted mt-0.5">{problems.join(", ")}</p>}
                    <p className="text-xs text-muted mt-1">{fmtDate(b.scheduled_date)} · {fmtTime(b.scheduled_time)} · {b.barangay}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Badge status={b.status} />
                    <JobActions bookingId={b.id} status={b.status} />
                    {(b.status === "in_progress" || b.status === "arrived") && (
                      <QuoteComposer bookingId={b.id} customer={b.customer?.full_name || "Customer"} service={services} />
                    )}
                    {b.status === "in_progress" && !(b.quotes || []).some((q: any) => q.status === "pending") && (b.quotes || []).some((q: any) => q.status === "approved") && <CompleteJobButton bookingId={b.id} />}
                    {b.status === "quote_pending" && <span className="text-xs text-muted">Waiting for approval</span>}
                    {b.status === "awaiting_confirmation" && <span className="text-xs text-muted">Waiting for customer</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">History ({history.length})</h2>
          <div className="divide-y divide-line">
            {history.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              return (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{b.customer?.full_name || "Customer"}</p>
                    <p className="text-xs text-muted mt-0.5">{services} · {fmtDate(b.scheduled_date)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {b.final_amount && <span className="text-sm font-medium">₱{Number(b.final_amount).toLocaleString()}</span>}
                    <Badge status={b.status} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}