import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/lib/icons"
import { peso } from "@/lib/format"
import { BookingTimeline } from "@/components/booking/BookingTimeline"
import { BookingRealtimeRefresh } from "@/components/booking/BookingRealtimeRefresh"

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return h12 + ":" + m + " " + ampm
}

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: b } = await supabase
    .from("bookings")
    .select(`
      id, status, scheduled_date, scheduled_time, barangay, address, final_amount, final_commission,
      payment_method, payment_reference, paid_at, payment_recorded_by,
      payment_confirmed_at, payment_confirmed_by,
      cancelled_at, cancelled_by, cancel_reason, technician_id, customer_id,
      created_at,
      customer:profiles!bookings_customer_id_fkey(id, full_name, email, phone),
      technician:technician_profiles!bookings_technician_id_fkey(
        profile:profiles!technician_profiles_id_fkey(full_name, email, phone)
      ),
      booking_items(id, service, problems, notes),
      estimates(id, technician_id, amount, eta_minutes, note, created_at,
        technician:technician_profiles!estimates_technician_id_fkey(
          profile:profiles!technician_profiles_id_fkey(full_name)
        )
      ),
      quotes(id, total, commission, status, quote_items(label, amount))
    `)
    .eq("id", id)
    .single()

  if (!b) {
    return (
      <div className="empty-state">
        <p className="text-sm">Booking not found.</p>
        <Link href="/admin/bookings" className="btn-link mt-3">← Back to bookings</Link>
      </div>
    )
  }

  const booking = b as any
  const techName = booking.technician?.profile?.full_name || null
  const customerName = booking.customer?.full_name || "—"
  const services = (booking.booking_items || []).map((i: any) => i.service).join(" + ")
  const approved = (booking.quotes || []).find((q: any) => q.status === "approved")
  const activeQuote = (booking.quotes || []).find((q: any) => q.status === "pending")

  return (
    <div className="max-w-6xl">
      <Link href="/admin/bookings" className="btn-back mb-6">
        <Icon name="chevron" className="w-4 h-4 rotate-180" />
        <span>Bookings</span>
      </Link>

      <BookingRealtimeRefresh bookingId={booking.id} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* LEFT — main content */}
        <div className="min-w-0 space-y-4">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5 gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{services || "Service request"}</h1>
              <Badge status={booking.status} />
            </div>

            <div className="text-xs text-muted font-mono mb-5">
              #{String(booking.id).slice(0, 8)}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted shrink-0">When</span>
                <span className="text-right">
                  {fmtDate(booking.scheduled_date)}
                  {booking.scheduled_time ? ` · ${fmtTime(booking.scheduled_time)}` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted shrink-0">Where</span>
                <span className="text-right">{booking.address || booking.barangay || "—"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted shrink-0">Created</span>
                <span className="text-right">
                  {booking.created_at ? new Date(booking.created_at).toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* People */}
          <div className="card p-6">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Participants</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="rounded-lg bg-surface-2 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">Customer</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0"
                       style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {customerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{customerName}</p>
                    {booking.customer?.email && (
                      <p className="text-xs text-muted truncate">{booking.customer.email}</p>
                    )}
                    {booking.customer?.phone && (
                      <p className="text-xs text-muted truncate">{booking.customer.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Technician */}
              <div className="rounded-lg bg-surface-2 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">Technician</p>
                {techName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0"
                         style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }}>
                      {techName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{techName}</p>
                      {booking.technician?.profile?.email && (
                        <p className="text-xs text-muted truncate">{booking.technician.profile.email}</p>
                      )}
                      {booking.technician?.profile?.phone && (
                        <p className="text-xs text-muted truncate">{booking.technician.profile.phone}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">Unassigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Service items */}
          {(booking.booking_items || []).length > 0 && (
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Reported issues</p>
              <div className="space-y-3">
                {(booking.booking_items || []).map((it: any) => (
                  <div key={it.id} className="rounded-lg bg-surface-2 p-3">
                    <p className="text-sm font-medium text-ink">{it.service}</p>
                    {(it.problems || []).length > 0 && (
                      <p className="text-xs text-muted mt-1">{(it.problems || []).join(", ")}</p>
                    )}
                    {it.notes && (
                      <p className="text-xs text-muted mt-1 italic">&quot;{it.notes}&quot;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price journey */}
          <div className="card p-6">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-5">Price journey</p>

            {/* Estimates */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="price-stage stage-estimated">Estimated</span>
              </div>
              {(booking.estimates || []).length > 0 ? (
                <div className="space-y-2">
                  {(booking.estimates || []).map((e: any) => (
                    <div key={e.id} className="px-3 py-3 rounded-lg bg-surface-2 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {e.technician?.profile?.full_name || "—"}
                        </p>
                        {e.note && <p className="text-xs text-muted mt-0.5">{e.note}</p>}
                        {e.eta_minutes != null && (
                          <p className="text-xs text-muted mt-0.5">~{e.eta_minutes} min ETA</p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-ink shrink-0">{peso(e.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No estimates.</p>
              )}
            </div>

            {/* Quote */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="price-stage stage-quotation">Quotation</span>
              </div>
              {activeQuote ? (
                <div className="card card-bordered p-4">
                  {(activeQuote.quote_items || []).map((it: any) => (
                    <div key={it.label} className="quote-line">
                      <span>{it.label}</span>
                      <span>{peso(it.amount)}</span>
                    </div>
                  ))}
                  <div className="quote-line font-semibold pt-3 border-t border-line">
                    <span>Total</span>
                    <span>{peso(activeQuote.total)}</span>
                  </div>
                  <p className="text-xs text-muted mt-3">Pending customer approval</p>
                </div>
              ) : approved ? (
                <div className="px-3 py-2 rounded-lg bg-surface-2 flex items-center justify-between">
                  <span className="text-sm text-muted">Approved</span>
                  <span className="text-sm font-semibold text-ink">{peso(approved.total)}</span>
                </div>
              ) : (
                <p className="text-sm text-muted">No quotation submitted.</p>
              )}
            </div>

            {/* Final */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="price-stage stage-final">Final price</span>
              </div>
              {booking.final_amount ? (
                <div className="space-y-1.5">
                  <div className="px-3 py-2 rounded-lg bg-surface-2 flex items-center justify-between">
                    <span className="text-sm text-muted">Final amount</span>
                    <span className="text-sm font-semibold text-ink">{peso(booking.final_amount)}</span>
                  </div>
                  {booking.final_commission && (
                    <div className="px-3 py-2 rounded-lg bg-surface-2 flex items-center justify-between">
                      <span className="text-sm text-muted">FixLink commission (10%)</span>
                      <span className="text-sm text-ink">{peso(booking.final_commission)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">Not yet agreed.</p>
              )}
            </div>
          </div>

          {/* Payment */}
          {(booking.paid_at || booking.payment_method) && (
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Payment</p>
              <div className="space-y-2 text-sm">
                {booking.payment_method && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Method</span>
                    <span className="text-ink">{booking.payment_method}</span>
                  </div>
                )}
                {booking.payment_reference && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Reference</span>
                    <span className="text-ink font-mono text-xs">{booking.payment_reference}</span>
                  </div>
                )}
                {booking.paid_at && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Recorded</span>
                    <span className="text-ink">{new Date(booking.paid_at).toLocaleString()}</span>
                  </div>
                )}
                {booking.payment_confirmed_at && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Confirmed</span>
                    <span className="text-ink">{new Date(booking.payment_confirmed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation */}
          {booking.status === "cancelled" && (
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Cancellation</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Cancelled by</span>
                  <span className="text-ink capitalize">{booking.cancelled_by || "—"}</span>
                </div>
                {booking.cancelled_at && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">When</span>
                    <span className="text-ink">{new Date(booking.cancelled_at).toLocaleString()}</span>
                  </div>
                )}
                {booking.cancel_reason && (
                  <div>
                    <span className="text-muted block mb-1">Reason</span>
                    <p className="text-ink italic">&quot;{booking.cancel_reason}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — timeline */}
        <aside>
          <div className="card p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Timeline</p>
            <BookingTimeline bookingId={booking.id} />
          </div>
        </aside>
      </div>
    </div>
  )
}