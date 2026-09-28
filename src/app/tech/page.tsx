import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { EstimateComposer } from "@/components/tech/EstimateComposer"

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
function fmtTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  return (hour % 12 === 0 ? 12 : hour % 12) + ":" + m + " " + (hour >= 12 ? "PM" : "AM")
}

export default async function TechDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. My invited booking ids
  const { data: invitedRows } = await supabase
    .from("booking_requested_techs")
    .select("booking_id")
    .eq("technician_id", user.id)
  const ids = (invitedRows || []).map((r: any) => r.booking_id)

  // 2. Fetch those bookings (simple select, no nested FK)
  const { data: pendingBookings } = ids.length
    ? await supabase
        .from("bookings")
        .select("id, status, scheduled_date, scheduled_time, barangay, customer_id, technician_id, booking_items(service, problems)")
        .in("id", ids)
        .in("status", ["pending", "estimated"])
        .is("technician_id", null)
        .order("created_at", { ascending: false })
    : { data: [] as any[] }

  // 3. My already-posted estimate ids
  const { data: myEstimates } = await supabase
    .from("estimates")
    .select("booking_id")
    .eq("technician_id", user.id)
  const myEstimateIds = new Set((myEstimates || []).map((e: any) => e.booking_id))

  // 4. Filter openRequests: not yet estimated by me
  const openRequests = (pendingBookings || []).filter((b: any) => !myEstimateIds.has(b.id))

  // 5. Customer names (separate query)
  const customerIds = [...new Set(openRequests.map((b: any) => b.customer_id).filter(Boolean))]
  const { data: customerProfiles } = customerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", customerIds)
    : { data: [] as any[] }
  const customerName = (id: string) =>
    (customerProfiles || []).find((p: any) => p.id === id)?.full_name || "Customer"

  // 6. Assigned jobs
  const { data: assigned } = await supabase
    .from("bookings")
    .select("id, status, scheduled_date, scheduled_time, barangay, customer_id, booking_items(service, problems)")
    .eq("technician_id", user.id)
    .order("scheduled_date", { ascending: true })

  const activeAssigned = (assigned || []).filter((b: any) => !["completed","cancelled","disputed"].includes(b.status))

  const assignedCustomerIds = [...new Set(activeAssigned.map((b: any) => b.customer_id).filter(Boolean))]
  const { data: assignedCustomers } = assignedCustomerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", assignedCustomerIds)
    : { data: [] as any[] }
  const assignedName = (id: string) =>
    (assignedCustomers || []).find((p: any) => p.id === id)?.full_name || "Customer"

  // 7. My stats
  const { data: me } = await supabase
    .from("technician_profiles")
    .select("rating, jobs_completed")
    .eq("id", user.id)
    .single()

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8 tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Active jobs</p>
          <p className="text-3xl font-semibold tracking-tight">{activeAssigned.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Estimate requests</p>
          <p className="text-3xl font-semibold tracking-tight">{openRequests.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Rating</p>
          <p className="text-3xl font-semibold tracking-tight">{(me?.rating || 0).toFixed(1)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Jobs done</p>
          <p className="text-3xl font-semibold tracking-tight">{me?.jobs_completed || 0}</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium">New estimate requests</h2>
          <Link href="/tech/estimates" className="btn-link text-xs">View all</Link>
        </div>
        {openRequests.length === 0 ? (
          <p className="text-sm text-muted py-2">No new requests right now.</p>
        ) : (
          <div className="divide-y divide-line">
            {openRequests.slice(0, 5).map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const problems = (b.booking_items || []).flatMap((i: any) => i.problems || [])
              return (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{services || "Service"}</p>
                    <p className="text-xs text-muted mt-0.5">{customerName(b.customer_id)} · {b.barangay}</p>
                    <p className="text-xs text-muted mt-0.5">{fmtDate(b.scheduled_date)}{b.scheduled_time ? " · " + fmtTime(b.scheduled_time) : ""}</p>
                    {problems.length > 0 && <p className="text-xs text-muted mt-1 truncate">{problems.join(", ")}</p>}
                  </div>
                  <EstimateComposer
                    bookingId={b.id}
                    service={services || "Service"}
                    customer={customerName(b.customer_id)}
                    barangay={b.barangay || "—"}
                    problems={problems}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium">My active jobs</h2>
          <Link href="/tech/schedule" className="btn-link text-xs">View all</Link>
        </div>
        {activeAssigned.length === 0 ? (
          <EmptyState icon="calendar" title="No active jobs" description="Jobs will appear here once a customer picks you." />
        ) : (
          <div className="divide-y divide-line">
            {activeAssigned.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              return (
                <Link key={b.id} href="/tech/schedule" className="py-4 flex items-center justify-between gap-3 hover:bg-surface-2 -mx-2 px-2 rounded transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{assignedName(b.customer_id)}</p>
                    <p className="text-xs text-muted mt-0.5">{services} · {b.barangay}</p>
                    <p className="text-xs text-muted mt-0.5">{fmtDate(b.scheduled_date)}{b.scheduled_time ? " · " + fmtTime(b.scheduled_time) : ""}</p>
                  </div>
                  <Badge status={b.status} />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}