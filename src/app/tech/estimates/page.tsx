import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/EmptyState"
import { EstimateRequestCard } from "@/components/tech/EstimateRequestCard"
import { Icon, ApplianceIcon } from "@/lib/icons"
import { peso } from "@/lib/format"
import { SERVICES } from "@/lib/booking/constants"

function serviceIdForLabel(label: string): string | null {
  const t = label.trim().toLowerCase()
  const hit = SERVICES.find((s) => s.label.toLowerCase() === t)
  return hit ? hit.id : null
}
function displayAddress(addr: string | null | undefined, barangay: string | null | undefined): string {
  const raw = (addr && addr.trim()) || barangay || ""
  if (!raw) return "--"
  const cleaned = raw.replace(/,\s*Philippines\s*$/i, "").trim()
  return cleaned.split(",").slice(0, 3).map((s) => s.trim()).join(", ")
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
        .select("id, status, scheduled_date, scheduled_time, barangay, address, lat, lng, created_at, customer_id, technician_id, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service, problems), estimates(id, technician_id)")
        .in("id", ids)
        .in("status", ["pending", "estimated"])
        .is("technician_id", null)
        .order("created_at", { ascending: false })
    : { data: [] as any[] }

  const { data: me } = await supabase
    .from("technician_profiles")
    .select("home_lat, home_lng")
    .eq("id", user.id)
    .maybeSingle()

  const openRequests = (requests || []).filter((b: any) => {
    const mine = (b.estimates || []).find((e: any) => e.technician_id === user.id)
    return !mine
  })

  const { data: posted } = await supabase
    .from("estimates")
    .select("id, amount, eta_minutes, note, created_at, booking:bookings(id, status, barangay, address, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service))")
    .eq("technician_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2 tracking-tight">Estimates</h1>
      <p className="text-muted mb-6 text-sm sm:text-base">Post a ballpark price before visiting. Final price is confirmed after inspection.</p>

      <div className="card p-4 sm:p-6 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">
          New requests ({openRequests.length})
        </h2>
        {openRequests.length === 0 ? (
          <EmptyState icon="inbox" title="No new requests" description="You'll see customer requests here." />
        ) : (
          <div className="flex flex-col gap-3">
            {openRequests.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const problems = (b.booking_items || []).flatMap((i: any) => i.problems || [])
              return (
                <EstimateRequestCard
                  key={b.id}
                  bookingId={b.id}
                  services={services || "Service"}
                  customerName={b.customer?.full_name || "Customer"}
                  customerId={b.customer_id}
                  barangay={b.barangay || null}
                  address={b.address || null}
                  scheduledDate={b.scheduled_date}
                  scheduledTime={b.scheduled_time}
                  createdAt={b.created_at}
                  bookingLat={b.lat}
                  bookingLng={b.lng}
                  techLat={me?.home_lat ?? null}
                  techLng={me?.home_lng ?? null}
                  problems={problems}
                  showChat
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="card p-4 sm:p-6">
        <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-4">
          Posted estimates ({posted?.length || 0})
        </h2>
        {!posted || posted.length === 0 ? (
          <p className="text-sm text-muted">No estimates posted yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posted.map((e: any) => {
              const services = (e.booking?.booking_items || []).map((i: any) => i.service).join(" + ")
              const status = e.booking?.status || "unknown"
              const firstService = services.split(" + ")[0]?.trim() || "Service"
              const iconId = serviceIdForLabel(firstService)
              const loc = displayAddress(e.booking?.address, e.booking?.barangay)
              const statusColor =
                status === "completed"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : status === "cancelled"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"

              return (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border border-line bg-surface-2/40 hover:bg-surface-2 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                      }}
                      aria-hidden
                    >
                      {iconId ? (
                        <ApplianceIcon id={iconId} className="w-5 h-5" />
                      ) : (
                        <Icon name="wrench" className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{services || "Service"}</p>

                      <div className="flex items-center gap-1.5 text-xs text-muted mt-1 flex-wrap">
                        <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[40ch]">{e.booking?.customer?.full_name || "Customer"}</span>
                        {loc !== "--" && (
                          <>
                            <span className="opacity-40">{"\u00B7"}</span>
                            <Icon name="pin" className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[44ch]" title={e.booking?.address || ""}>{loc}</span>
                          </>
                        )}
                      </div>

                      {e.note && (
                        <p className="text-xs text-muted mt-1 italic">&quot;{e.note}&quot;</p>
                      )}
                      {e.eta_minutes != null && (
                        <p className="text-xs text-muted mt-1">~{e.eta_minutes} min ETA</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <p className="text-base font-semibold text-ink">{peso(e.amount)}</p>
                    <span className={"text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium border " + statusColor}>
                      {status}
                    </span>
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