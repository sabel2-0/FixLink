import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/lib/icons"
import { EmptyState } from "@/components/ui/EmptyState"
import { JobActions } from "@/components/tech/JobActions"
import { QuoteComposer } from "@/components/tech/QuoteComposer"
import { CompleteJobButton } from "@/components/tech/CompleteJobButton"
import { ConfirmPaymentReceived } from "@/components/booking/ConfirmPaymentReceived"
import { BookingRealtimeRefresh } from "@/components/booking/BookingRealtimeRefresh"
import { ViewLocationButton } from "@/components/booking/ViewLocationButton"

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
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
    .select("id, status, customer_id, scheduled_date, scheduled_time, barangay, address, lat, lng, final_amount, final_commission, payment_method, payment_reference, paid_at, payment_recorded_by, payment_confirmed_at, payment_confirmed_by, customer:profiles!bookings_customer_id_fkey(full_name, phone), booking_items(service, problems, notes), estimates(id, technician_id, amount, eta_minutes, note, created_at), quotes(id, status, total, note, sent_at, decided_at, quote_items(label, amount))")
    .eq("technician_id", user.id)
    .order("scheduled_date", { ascending: true })

  const active = (jobs || []).filter((b: any) => !["completed", "cancelled", "disputed"].includes(b.status))
  const history = (jobs || []).filter((b: any) => ["completed", "cancelled", "disputed"].includes(b.status))

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1 tracking-tight">Jobs</h1>
        <p className="text-muted">Active jobs and history.</p>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium">Active</h2>
          {active.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {active.length}
            </span>
          )}
        </div>

        {active.length === 0 ? (
          <div className="card p-10">
            <EmptyState icon="calendar" title="No active jobs" description="Customers will pick you from your estimates." />
          </div>
        ) : (
          <div className="space-y-5">
            {active.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const problems = (b.booking_items || []).flatMap((i: any) => i.problems || [])
              const quotes = b.quotes || []
              const hasPendingQuote = quotes.some((q: any) => q.status === "pending")
              const hasApprovedQuote = quotes.some((q: any) => q.status === "approved")
              const hasDeclinedQuote = quotes.some((q: any) => q.status === "declined")
              const showQuoteComposer =
                (b.status === "in_progress" || b.status === "arrived") &&
                !hasPendingQuote &&
                !hasApprovedQuote
              const showCompleteButton =
                b.status === "in_progress" && hasApprovedQuote
              const myEst = (b.estimates || []).find((e: any) => e.technician_id === user.id)

              return (
                <div key={b.id} className="card p-6 sm:p-7">
                  <BookingRealtimeRefresh bookingId={b.id} />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 text-base"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                      >
                        {(b.customer?.full_name || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-ink truncate">{b.customer?.full_name || "Customer"}</p>
                        <p className="text-sm text-muted mt-0.5 truncate">{services || "Service"}</p>
                      </div>
                    </div>
                    <Badge status={b.status} />
                  </div>

                  {/* Key/value grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
                    <div className="flex items-start gap-3">
                      <Icon name="calendar" className="w-4 h-4 text-muted shrink-0 mt-1" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted font-medium">When</p>
                        <p className="text-sm text-ink mt-1">
                          {fmtDate(b.scheduled_date)}
                          {b.scheduled_time && <span className="text-muted"> · {fmtTime(b.scheduled_time)}</span>}
                        </p>
                      </div>
                    </div>

                    {myEst ? (
                      <div className="flex items-start gap-3">
                        <Icon name="tag" className="w-4 h-4 text-muted shrink-0 mt-1" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Your estimate</p>
                          <p className="text-sm mt-1">
                            <span className="text-ink font-semibold">₱{Number(myEst.amount).toLocaleString()}</span>
                            {myEst.eta_minutes != null && <span className="text-muted"> · ETA ~{myEst.eta_minutes} min</span>}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {b.address && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <Icon name="map" className="w-4 h-4 text-muted shrink-0 mt-1" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Where</p>
                          <p className="text-sm text-ink mt-1">{b.address}</p>
                          {b.barangay && <p className="text-xs text-muted mt-0.5">{b.barangay}</p>}
                        </div>
                      </div>
                    )}

                    {b.customer?.phone && (
                      <div className="flex items-start gap-3">
                        <Icon name="user" className="w-4 h-4 text-muted shrink-0 mt-1" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Contact</p>
                          <p className="text-sm text-ink mt-1">{b.customer.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Problem chips */}
                  {problems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {problems.map((p: string, i: number) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-1 rounded-full"
                          style={{ background: "var(--surface-2)", color: "var(--muted)" }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

{quotes.length > 0 && (() => {
                    const q = quotes[0]
                    return (
                      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Your final quote</p>
                          <span className={
                            "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium " +
                            (q.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                             q.status === "declined" ? "bg-red-500/15 text-red-400" :
                             "bg-amber-500/15 text-amber-400")
                          }>
                            {q.status}
                          </span>
                        </div>
                        {(q.quote_items || []).map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-muted py-0.5">
                            <span>{it.label}</span>
                            <span className="text-ink">₱{Number(it.amount).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold pt-2 mt-2 border-t border-line">
                          <span>Total</span>
                          <span className="text-ink">₱{Number(q.total).toLocaleString()}</span>
                        </div>
                        {q.note && <p className="text-xs text-muted mt-2 italic">"{q.note}"</p>}
                      </div>
                    )
                  })()}
                  {/* Status hints */}
                  {hasPendingQuote && (
                    <p className="text-xs text-muted mb-4">Waiting for customer to approve your quote.</p>
                  )}
                  {hasApprovedQuote && b.status !== "awaiting_confirmation" && (
                    <p className="text-xs mb-4" style={{ color: "var(--success)" }}>Quote approved — ready to complete.</p>
                  )}
                  {hasDeclinedQuote && !hasPendingQuote && !hasApprovedQuote && (
                    <p className="text-xs mb-4" style={{ color: "var(--danger)" }}>Quote declined — send a new one.</p>
                  )}
                  {b.status === "awaiting_confirmation" && (
                    <p className="text-xs text-muted mb-4">Waiting for customer confirmation.</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap pt-5 border-t border-line">
{/* Start only after the customer approves a quote */}
                    {(b.status !== "arrived" || hasApprovedQuote) && (
                      <JobActions bookingId={b.id} status={b.status} />
                    )}
                    {b.status === "arrived" && !hasApprovedQuote && (
                      <span className="text-xs text-muted">
                        {hasPendingQuote ? "Waiting for customer to approve your quote." : "Send a quote to proceed."}
                      </span>
                    )}

                    <ViewLocationButton
                      lat={b.lat}
                      lng={b.lng}
                      label={`${b.customer?.full_name || "Customer"} · ${b.barangay || "Location"}`}
                      address={b.address}
                    />

                    {showQuoteComposer && (
                      <QuoteComposer
                        bookingId={b.id}
                        customer={b.customer?.full_name || "Customer"}
                        service={services}
                      />
                    )}

                    {showCompleteButton && <CompleteJobButton bookingId={b.id} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs uppercase tracking-wider text-muted font-medium">History</h2>
            <span className="text-[10px] text-muted">{history.length}</span>
          </div>

          <div className="card overflow-hidden">
            <div className="divide-y divide-line">
              {history.map((b: any) => {
                const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
                return (
                  <Link
                    key={b.id}
                    href={`/tech/jobs/${b.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-surface-2 transition"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 text-xs"
                      style={{ background: "var(--surface-2)", color: "var(--muted)" }}
                    >
                      {(b.customer?.full_name || "C").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{b.customer?.full_name || "Customer"}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {services || "Service"} · {fmtDate(b.scheduled_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {b.final_amount && (
                        <span className="text-sm font-medium text-ink">
                          ₱{Number(b.final_amount).toLocaleString()}
                        </span>
                      )}
                      <Badge status={b.status} />
                      <Icon name="chevron" className="w-4 h-4 text-muted" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
