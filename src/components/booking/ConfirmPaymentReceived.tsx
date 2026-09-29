"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

export function ConfirmPaymentReceived({ bookingId, amount, method, reference }: { bookingId: string; amount: number; method: string; reference: string | null }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      const { error: e } = await supabase
        .from("bookings")
        .update({
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: "technician",
        })
        .eq("id", bookingId)
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
      <button type="button" onClick={() => setOpen(true)} className="btn-primary text-xs py-2 px-3">
        Confirm received
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">Confirm payment received?</p>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn"><Icon name="x" className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                The customer recorded a payment of <b style={{ color: "var(--ink)" }}>₱{amount.toLocaleString()}</b> via <b style={{ color: "var(--ink)" }}>{method}</b>{reference ? <> (ref <span className="font-mono text-xs">{reference}</span>)</> : null}.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Confirming marks this payment as verified on both sides. FixLink's 10% commission becomes due.
              </p>
              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>
            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>Not yet</button>
              <button type="button" className="btn-primary flex-1" onClick={confirm} disabled={busy}>{busy ? "…" : "Yes, received"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}