"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

const METHODS = ["Cash", "GCash", "Maya", "Bank transfer"]

export function PaymentRecorder({ bookingId, finalAmount, myRole }: { bookingId: string; finalAmount: number; myRole: "customer" | "technician" }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("Cash")
  const [reference, setReference] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function record() {
    setBusy(true)
    setError(null)
    try {
      const { error: e } = await supabase
        .from("bookings")
        .update({
          payment_method: method,
          payment_reference: reference.trim() || null,
          paid_at: new Date().toISOString(),
          payment_recorded_by: myRole,
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
      <button type="button" onClick={() => setOpen(true)} className={myRole === "technician" ? "btn-secondary w-full" : "btn-secondary w-full"}>
        <Icon name="dollar" className="w-4 h-4" />
        Record payment ({myRole === "technician" ? "received" : "made"})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">Record payment</p>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn"><Icon name="x" className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="input-label">Payment method</label>
                <div className="seg">
                  {METHODS.map((m) => (
                    <button key={m} type="button" className={method === m ? "active" : ""} onClick={() => setMethod(m)} style={{ fontSize: 12 }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Reference (optional)</label>
                <input
                  className="input text-sm"
                  placeholder={method === "Cash" ? "n/a" : "GCash/Maya ref number"}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="rounded-xl bg-surface-2 p-3 flex items-center justify-between text-sm">
                <span className="text-muted">Amount</span>
                <span className="font-semibold">₱{finalAmount.toLocaleString()}</span>
              </div>
              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>
            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="button" className="btn-primary flex-1" onClick={record} disabled={busy}>{busy ? "…" : "Record"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}