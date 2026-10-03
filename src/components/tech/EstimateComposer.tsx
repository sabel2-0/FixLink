"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { peso } from "@/lib/format"

type Props = {
  bookingId: string
  customer: string
  service: string
  barangay?: string | null
  problems?: string[]
}

export function EstimateComposer({ bookingId, customer, service, barangay, problems = [] }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState("")
  const [arrivalTime, setArrivalTime] = useState("")  // HH:MM
  const [note, setNote] = useState("")
  const [scheduled, setScheduled] = useState<{ date: string | null; time: string | null }>({ date: null, time: null })

  // Fetch the customer's requested date + time once
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from("bookings")
        .select("scheduled_date, scheduled_time")
        .eq("id", bookingId)
        .maybeSingle()
      if (cancelled || !data) return
      setScheduled({ date: data.scheduled_date, time: data.scheduled_time })
      // Default arrival = scheduled time (or blank if none)
      if (data.scheduled_time && !arrivalTime) {
        setArrivalTime(data.scheduled_time.slice(0, 5))
      }
    })()
    return () => { cancelled = true }
  }, [open, bookingId, supabase, arrivalTime])

  const priceNum = Number(amount) || 0
  const commission = Math.round(priceNum * 0.10)
  const netEarnings = priceNum - commission

  function fmtDate(d: string | null) {
    if (!d) return "—"
    const dt = new Date(d)
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  }
  function fmtTime(t: string | null) {
    if (!t) return ""
    const [h, m] = t.split(":")
    const hour = parseInt(h, 10)
    if (isNaN(hour)) return t
    return (hour % 12 === 0 ? 12 : hour % 12) + ":" + m + " " + (hour >= 12 ? "PM" : "AM")
  }

  // Compute minutes between scheduled_time and arrivalTime
  function computeEtaMinutes(): number {
    if (!scheduled.time || !arrivalTime) return 0
    const [sh, sm] = scheduled.time.split(":").map(Number)
    const [ah, am] = arrivalTime.split(":").map(Number)
    if ([sh, sm, ah, am].some(isNaN)) return 0
    let diff = (ah * 60 + am) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60  // crossing midnight
    return diff
  }

  // Only consider times STRICTLY after the customer's requested time.
  // Same time or earlier â†’ invalid.
  const minAllowedTime = (() => {
    if (!scheduled.time) return ""
    const [h, m] = scheduled.time.split(":").map(Number)
    if (isNaN(h) || isNaN(m)) return ""
    // +1 minute so same time is invalid
    const total = h * 60 + m + 1
    const hh = Math.floor(total / 60) % 24
    const mm = total % 60
    return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0")
  })()

  const etaMin = computeEtaMinutes()
  const arrivalValid = !!arrivalTime && (!scheduled.time || etaMin > 0)
  const arrivalError = arrivalTime && scheduled.time && etaMin <= 0
    ? "Arrival must be later than the customer's requested time."
    : null

  function close() {
    if (busy) return
    setOpen(false)
    setError(null)
    setAmount("")
    setNote("")
    setArrivalTime(scheduled.time ? scheduled.time.slice(0, 5) : "")
  }

  async function submit() {
    setError(null)

    if (!priceNum || priceNum <= 0) {
      setError("Enter a valid estimated price.")
      return
    }
    if (!arrivalTime) {
      setError("Enter your arrival time so the customer can plan.")
      return
    }
    if (scheduled.time && etaMin <= 0) {
      setError(`Arrival must be later than ${fmtTime(scheduled.time)}.`)
      return
    }

    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error: insertErr } = await supabase.from("estimates").insert({
        booking_id: bookingId,
        technician_id: user.id,
        amount: priceNum,
        eta_minutes: etaMin,
        note: note.trim() || null,
      })
      if (insertErr) throw new Error(insertErr.message)

      startTransition(() => router.refresh())
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post estimate")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary text-xs py-2 px-3 whitespace-nowrap"
      >
        Post estimate
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
               style={{ maxHeight: "92vh" }}>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-line flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink tracking-tight">Post estimate</h3>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {service}{customer ? ` - ${customer}` : ""}{barangay ? ` - ${barangay}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="icon-btn shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
              {problems.length > 0 && (
                <div>
                  <label className="input-label">Reported issues</label>
                  <div className="rounded-lg bg-surface-2 p-3 text-sm text-ink leading-relaxed">
                    {problems.join(", ")}
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">Customer's requested schedule</label>
                <div className="rounded-lg p-3 flex items-center gap-2.5"
                     style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }}>
                    <rect x="3" y="4" width="18" height="18" rx="3" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-sm font-medium text-ink">
                    {fmtDate(scheduled.date)}
                    {scheduled.time && <span className="text-muted font-normal"> - {fmtTime(scheduled.time)}</span>}
                  </p>
                </div>
              </div>

              <div>
                <label className="input-label">Estimated price (₱) *</label>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 800"
                  className="input"
                  autoFocus
                />
                {priceNum > 0 && (
                  <div className="mt-2 rounded-lg bg-surface-2 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted">FixLink commission (10%)</span>
                      <span className="text-ink">−{peso(commission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">You receive</span>
                      <span className="font-semibold" style={{ color: "var(--success)" }}>{peso(netEarnings)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="input-label">Your arrival time *</label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  min={minAllowedTime || undefined}
                  className="input"
                  style={arrivalError ? { borderColor: "var(--danger)" } : undefined}
                />
                {arrivalError ? (
                  <p className="text-[11px] text-red-500 mt-1.5">{arrivalError}</p>
                ) : arrivalValid && scheduled.time ? (
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--success)" }}>
                    âœ“ That&apos;s <strong>{etaMin} min</strong> after their requested {fmtTime(scheduled.time)}.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted mt-1.5">
                    Must be <strong>later</strong> than the customer&apos;s requested {scheduled.time ? fmtTime(scheduled.time) : "time"} on {fmtDate(scheduled.date)}.
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">Note to customer (optional)</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Standard cleaning if split-type; no freon needed"
                  className="input"
                />
              </div>

              <div className="rounded-lg p-3 text-xs leading-relaxed"
                   style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", color: "var(--ink)" }}>
                This is an estimate only. Final price is confirmed after inspection.
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-line flex gap-2 shrink-0">
              <button
                type="button"
                onClick={close}
                disabled={busy || pending}
                className="btn-secondary flex-1 !py-2.5 !text-[15px] whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || pending || !!arrivalError || !arrivalValid}
                className="btn-primary flex-1 !py-2.5 !text-[15px] whitespace-nowrap disabled:opacity-50"
              >
                {busy ? "Posting..." : "Post estimate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}