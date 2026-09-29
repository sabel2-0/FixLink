import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/lib/icons"
import { peso } from "@/lib/format"
import { LiveMapWrapper } from "@/components/booking/LiveMapWrapper"
import { CancelBookingButton } from "@/components/booking/CancelBookingButton"
import { SelectEstimateButton } from "@/components/booking/SelectEstimateButton"
import { DecideQuoteButtons } from "@/components/booking/DecideQuoteButtons"
import { ConfirmJobButton } from "@/components/booking/ConfirmJobButton"
import { PaymentRecorder } from "@/components/booking/PaymentRecorder"
import { PaymentReceipt } from "@/components/booking/PaymentReceipt"
import { ChatButton } from "@/components/chat/ChatButton"
import { BookingTimeline } from "@/components/booking/BookingTimeline"

function formatDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return h12 + ":" + m + " " + ampm
}

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: b } = await supabase
    .from("bookings")
    .select("id, status, scheduled_date, scheduled_time, barangay, address, final_amount, technician_id, cancelled_at, cancelled_by, cancel_reason, payment_method, payment_reference, paid_at, payment_recorded_by, payment_confirmed_at, payment_confirmed_by, technician:technician_profiles!bookings_technician_id_fkey(id, rating, profile:profiles!technician_profiles_id_fkey(full_name)), booking_items(id, service, problems, notes), estimates(id, technician_id, amount, eta_minutes, note, created_at, technician:technician_profiles!estimates_technician_id_fkey(profile:profiles!technician_profiles_id_fkey(full_name))), quotes(id, total, commission, status, quote_items(label, amount))")
    .eq("id", id)
    .single()

  if (!b) return <div className="empty-state"><p className="text-sm">Booking not found.</p></div>

  const booking = b as any
  const tech = booking.technician?.profile?.full_name || null
  const approved = (booking.quotes || []).find((q: any) => q.status === "approved")
  const active = (booking.quotes || []).find((q: any) => q.status === "pending")

  let invitedTechs: any[] = []
  if (!booking.technician_id) {
    const { data: invited } = await supabase.rpc("get_booking_invited_techs", { p_booking_id: id })
    invitedTechs = invited || []
  }

  const services = (booking.booking_items || []).map((i: any) => i.service).join(" + ")
  const isCancelled = booking.status === "cancelled"
  const isTerminal = ["completed", "cancelled", "disputed"].includes(booking.status)
  const isPendingEstimate = ["pending", "estimated"].includes(booking.status)

  return (
    <div className="max-w-2xl">
      <Link href="/app/bookings" className="btn-back mb-6">
        <Icon name="chevron" className="w-4 h-4 rotate-180" />
        <span>Bookings</span>
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{services || "Service request"}</h1>
          <Badge status={booking.status} />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted shrink-0">When</span>
            <span className="text-right">
              {formatDate(booking.scheduled_date)}{booking.scheduled_time ? " · " + formatTime(booking.scheduled_time) : ""}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted shrink-0">Where</span>
            <span className="text-right">{booking.address || booking.barangay || "—"}</span>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-line">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
            {tech ? "Assigned technician" : invitedTechs.length > 0 ? invitedTechs.length + " technician" + (invitedTechs.length === 1 ? "" : "s") + " invited" : "Technician"}
          </p>

          {tech ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center font-semibold shrink-0">
                {tech.slice(0, 1).toUpperCase()}
              </div>
              <p className="text-sm font-medium">{tech}</p>
            </div>
          ) : invitedTechs.length > 0 ? (
            <div className="space-y-2">
              {invitedTechs.map((t: any) => (
                <div key={t.technician_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {(t.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {t.full_name}
                      {t.certified && <Icon name="shieldCheck" className="w-3.5 h-3.5 text-[var(--success)]" />}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {t.home_barangay || "—"}
                      {t.distance_km != null && " · " + Number(t.distance_km).toFixed(1) + " km away"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.rating != null && (
                      <span className="text-xs text-muted">&#9733; {Number(t.rating).toFixed(1)}</span>
                    )}
                    <ChatButton
                      bookingId={booking.id}
                      partnerId={t.technician_id}
                      partnerName={t.full_name || "Technician"}
                      partnerRole="Technician"
                      variant="icon"
                    />
                  </div>
                </div>
              ))}
              {!isTerminal && (
                <p className="text-xs text-muted pt-1">They'll each send their own estimate — you pick one to visit.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Awaiting assignment</p>
          )}
        </div>
      </div>

      {tech && !isTerminal && (
        <div className="card p-6 mb-4">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Live location</p>
          <LiveMapWrapper technicianId={booking.technician_id} />
        </div>
      )}

      <div className="card p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-muted font-medium mb-5">Price journey</p>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="price-stage stage-estimated">Estimated</span>
            <span className="text-xs text-muted">Before inspection</span>
          </div>
          {(booking.estimates || []).length > 0 ? (
            <div className="space-y-2">
              {(booking.estimates || []).map((e: any) => {
                const isChosen = booking.technician_id === e.technician_id
                const canSelect = !booking.technician_id && ["pending", "estimated"].includes(booking.status)
                return (
                  <div key={e.id} className={"px-3 py-3 rounded-lg flex items-center gap-3 " + (isChosen ? "border-2" : "bg-surface-2")} style={isChosen ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate flex items-center gap-2">
                        {e.technician?.profile?.full_name || "—"}
                        {isChosen && <span className="badge badge-info text-[10px]">Selected</span>}
                      </p>
                      {e.note && <p className="text-xs text-muted mt-0.5">{e.note}</p>}
                      {e.eta_minutes != null && <p className="text-xs text-muted mt-0.5">~{e.eta_minutes} min ETA</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-semibold">{peso(e.amount)}</p>
                      {canSelect && e.technician_id && (
                        <SelectEstimateButton
                          bookingId={booking.id}
                          technicianId={e.technician_id}
                          technicianName={e.technician?.profile?.full_name || "Technician"}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : isCancelled ? (
            <p className="text-sm text-muted">Cancelled before estimates were received.</p>
          ) : isPendingEstimate && invitedTechs.length > 0 ? (
            <div className="px-3 py-3 rounded-lg bg-surface-2 flex items-center gap-3">
              <div style={{ width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <p className="text-sm text-muted">Waiting for {invitedTechs.length} technician{invitedTechs.length === 1 ? "" : "s"} to send their estimate…</p>
            </div>
          ) : (
            <p className="text-sm text-muted">No estimates were received.</p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="price-stage stage-quotation">Quotation</span>
            <span className="text-xs text-muted">After inspection</span>
          </div>
          {active ? (
            <div className="card card-bordered p-4">
              {(active.quote_items || []).map((it: any) => (
                <div key={it.label} className="quote-line"><span>{it.label}</span><span>{peso(it.amount)}</span></div>
              ))}
              <div className="quote-line font-semibold pt-3 border-t border-line"><span>Total</span><span>{peso(active.total)}</span></div>
              <DecideQuoteButtons quoteId={active.id} total={Number(active.total)} technicianName={tech || "the technician"} />
            </div>
          ) : approved ? (
            <div className="px-3 py-2 rounded-lg bg-surface-2 flex items-center justify-between">
              <span className="text-sm">Approved by you</span>
              <span className="text-sm font-semibold">{peso(approved.total)}</span>
            </div>
          ) : isCancelled ? (
            <p className="text-sm text-muted">No quotation — booking was cancelled.</p>
          ) : (
            <p className="text-sm text-muted">Waiting for the technician to inspect and submit a quotation.</p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="price-stage stage-final">Final price</span>
          </div>
          {booking.final_amount ? (
            <div className="px-3 py-2 rounded-lg bg-surface-2 flex items-center justify-between">
              <span className="text-sm">Final amount</span>
              <span className="text-sm font-semibold">{peso(booking.final_amount)}</span>
            </div>
          ) : (
            <p className="text-sm text-muted">Not yet agreed.</p>
          )}
        </div>
      </div>

      {booking.status === "awaiting_confirmation" && (
        <div className="card p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}>
              <Icon name="check" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5">Technician marked the job done</p>
              <p className="text-xs text-muted leading-relaxed">
                Review the work. Once you confirm, pay {tech || "the technician"} &#8369;{Number(booking.final_amount || 0).toLocaleString()} in cash or GCash.
              </p>
            </div>
          </div>
          <ConfirmJobButton
            bookingId={booking.id}
            finalAmount={Number(booking.final_amount || 0)}
            technicianName={tech || "the technician"}
          />
        </div>
      )}

      {booking.status === "completed" && (
        <>
          {booking.paid_at ? (
            <PaymentReceipt
              finalAmount={Number(booking.final_amount || 0)}
              method={booking.payment_method}
              reference={booking.payment_reference}
              recordedBy={booking.payment_recorded_by}
              paidAt={booking.paid_at}
              confirmedBy={booking.payment_confirmed_by}
              confirmedAt={booking.payment_confirmed_at}
              commission={Number(booking.final_commission || Math.round(Number(booking.final_amount || 0) * 0.10))}
              technicianName={tech || "the technician"}
              serviceLabel={(booking.booking_items || []).map((i: any) => i.service).join(" + ")}
              scheduledDate={booking.scheduled_date}
            />
          ) : (
            <div className="card p-5 mb-4">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Payment</p>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Pay ₱{Number(booking.final_amount || 0).toLocaleString()} directly to {tech || "the technician"}.
                Record the payment here for both your records.
              </p>
              <PaymentRecorder
                bookingId={booking.id}
                finalAmount={Number(booking.final_amount || 0)}
                myRole="customer"
              />
            </div>
          )}
        </>
      )}

      <div className="card p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Timeline</p>
        <BookingTimeline bookingId={booking.id} />
      </div>

      {booking.status === "cancelled" && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <p className="text-sm font-medium">Cancelled</p>
            <Badge status="cancelled" />
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">Cancelled by</span>
              <span className="capitalize">{booking.cancelled_by || "—"}</span>
            </div>
            {booking.cancelled_at && (
              <div className="flex justify-between gap-3">
                <span className="text-muted">When</span>
                <span>{new Date(booking.cancelled_at).toLocaleString()}</span>
              </div>
            )}
            {booking.cancel_reason && (
              <div>
                <span className="text-muted block mb-1">Reason</span>
                <p className="text-sm italic">"{booking.cancel_reason}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card p-5">
        <CancelBookingButton bookingId={booking.id} status={booking.status} />
        {booking.status === "cancelled" && (
          <p className="text-xs text-muted text-center">This booking is already cancelled.</p>
        )}
        {!["pending","estimated","confirmed","en_route","arrived","cancelled"].includes(booking.status) && (
          <p className="text-xs text-muted text-center">This booking can no longer be cancelled. Contact the technician or admin if there&apos;s an issue.</p>
        )}
      </div>
    </div>
  )
}
