"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

export function ConfirmJobButton({ bookingId, finalAmount, technicianName }: { bookingId: string; finalAmount: number; technicianName: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")
      const { error: e } = await supabase
        .from("bookings")
        .update({ status: "completed", confirmed_at: new Date().toISOString(), completed_at: new Date().toISOString() })
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
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full">
        <Icon name="check" className="w-4 h-4" />
        Confirm job is done
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">Confirm job completion?</p>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn"><Icon name="x" className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                <b style={{ color: "var(--ink)" }}>{technicianName}</b> marked this job as done. Confirm to close the booking and pay ₱{finalAmount.toLocaleString()} directly in cash or GCash.
              </p>
              <div className="rounded-xl bg-surface-2 p-3 flex items-center justify-between text-sm">
                <span className="text-muted">You pay</span>
                <span className="font-semibold">₱{finalAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                After confirming, you can record the payment method so FixLink and the technician both have it on record.
              </p>
              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>
            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>Not yet</button>
              <button type="button" className="btn-primary flex-1" onClick={confirm} disabled={busy}>{busy ? "…" : "Yes, confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}