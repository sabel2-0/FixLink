import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/EmptyState"
import { EstimateComposer } from "@/components/tech/EstimateComposer"
import { ChatButton } from "@/components/chat/ChatButton"
import { peso } from "@/lib/format"

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

export default async function TechEstimates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: invitedIds } = await supabase
    .from("booking_requested_techs")
    .select("booking_id")
    .eq("technician_id", user.id)
  const ids = (invitedIds || []).map((r: any) => r.booking_id)

  const { data: requests } = ids.length
    ? await supabase
        .from("bookings")
        .select("id, status, scheduled_date, scheduled_time, barangay, technician_id, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service, problems), estimates(id, technician_id)")
        .in("id", ids)
        .in("status", ["pending", "estimated"])
        .is("technician_id", null)
        .order("created_at", { ascending: false })
    : { data: [] as any[] }

  const openRequests = (requests || []).filter((b: any) => {
    const mine = (b.estimates || []).find((e: any) => e.technician_id === user.id)
    return !mine
  })

  const { data: posted } = await supabase
    .from("estimates")
    .select("id, amount, eta_minutes, note, created_at, booking:bookings(id, status, barangay, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service))")
    .eq("technician_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Estimates</h1>
      <p className="text-muted mb-6">Post a ballpark price before visiting. Final price is confirmed after inspection.</p>

      <div className="card p-6 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">New requests ({openRequests.length})</h2>
        {openRequests.length === 0 ? (
          <EmptyState icon="inbox" title="No new requests" description="You'll see customer requests here." />
        ) : (
          <div className="divide-y divide-line">
            {openRequests.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const problems = (b.booking_items || []).flatMap((i: any) => i.problems || [])
              return (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{services || "Service"}</p>
                    <p className="text-xs text-muted mt-0.5">{b.customer?.full_name || "Customer"} · {b.barangay}</p>
                    <p className="text-xs text-muted mt-0.5">{fmtDate(b.scheduled_date)}{b.scheduled_time ? " · " + fmtTime(b.scheduled_time) : ""}</p>
                    {problems.length > 0 && <p className="text-xs text-muted mt-1 truncate">{problems.join(", ")}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChatButton
                      bookingId={b.id}
                      partnerId={b.customer_id}
                      partnerName={b.customer?.full_name || "Customer"}
                      partnerRole={services || "Service"}
                      variant="icon"
                    />
                    <EstimateComposer
                    bookingId={b.id}
                    service={services || "Service"}
                    customer={b.customer?.full_name || "Customer"}
                    barangay={b.barangay || "—"}
                    problems={problems}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Posted estimates ({posted?.length || 0})</h2>
        {!posted || posted.length === 0 ? (
          <p className="text-sm text-muted">No estimates posted yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {posted.map((e: any) => {
              const services = (e.booking?.booking_items || []).map((i: any) => i.service).join(" + ")
              return (
                <div key={e.id} className="py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{services || "Service"}</p>
                    <p className="text-xs text-muted mt-0.5">{e.booking?.customer?.full_name || "Customer"} · {e.booking?.barangay}</p>
                    {e.note && <p className="text-xs text-muted mt-0.5 italic">"{e.note}"</p>}
                    {e.eta_minutes != null && <p className="text-xs text-muted mt-0.5">~{e.eta_minutes} min ETA</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{peso(e.amount)}</p>
                    <p className="text-xs text-muted mt-0.5">{e.booking?.status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}