"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

const CANCELLABLE = ["pending", "estimated", "confirmed", "en_route", "arrived"]

export function CancelBookingButton({ bookingId, status }: { bookingId: string; status: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!CANCELLABLE.includes(status)) return null

  async function confirmCancel() {
    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error: e } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: "customer",
          cancel_reason: reason.trim() || null,
        })
        .eq("id", bookingId)
        .eq("customer_id", user.id)
      if (e) throw e


      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full" style={{ color: "var(--danger)" }}>
        <Icon name="x" className="w-4 h-4" />
        Cancel booking
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">Cancel this booking?</p>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="rounded-xl p-3 flex items-start gap-3"
                style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}
              >
                <Icon name="alert" className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  This will notify the technician(s) you invited. The booking stays in your history with this reason. You can create a new request right after.
                </p>
              </div>

              <div>
                <label className="input-label">Reason (optional)</label>
                <textarea
                  rows={3}
                  className="input text-sm"
                  placeholder="e.g. Wrong date, changed my mind, found someone else"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>
                Keep booking
              </button>
              <button
                type="button"
                className="btn-danger flex-1"
                onClick={confirmCancel}
                disabled={busy}
                style={{ background: "var(--danger)", color: "#fff" }}
              >
                {busy ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}