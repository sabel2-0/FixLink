"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

type Props = { quoteId: string; total: number; technicianName: string }

export function DecideQuoteButtons({ quoteId, total, technicianName }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<"approve" | "decline" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(action: "approve" | "decline") {
    setBusy(true)
    setError(null)
    try {
      const { data: q } = await supabase
        .from("quotes")
        .select("booking_id, total, commission")
        .eq("id", quoteId)
        .single()
      if (!q) throw new Error("Quote not found")

      const { error: qErr } = await supabase
        .from("quotes")
        .update({ status: action === "approve" ? "approved" : "declined", decided_at: new Date().toISOString() })
        .eq("id", quoteId)
      if (qErr) throw qErr

      const newStatus = action === "approve" ? "in_progress" : "cancelled"
      const update: any = { status: newStatus }
      if (action === "approve") {
        update.final_amount = q.total
        update.final_commission = q.commission || Math.round(Number(q.total) * 0.10)
      }
      const { error: bErr } = await supabase.from("bookings").update(update).eq("id", q.booking_id)
      if (bErr) throw bErr

      setConfirming(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={() => setConfirming("decline")} disabled={busy} className="btn-secondary flex-1">Decline</button>
        <button type="button" onClick={() => setConfirming("approve")} disabled={busy} className="btn-primary flex-1">
          {busy ? "…" : "Approve ₱" + total.toLocaleString()}
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirming(null) }}>
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">{confirming === "approve" ? "Approve this quotation?" : "Decline this quotation?"}</p>
              <button type="button" onClick={() => setConfirming(null)} className="icon-btn"><Icon name="x" className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                {confirming === "approve"
                  ? <>You are approving a final price of <b style={{ color: "var(--ink)" }}>₱{total.toLocaleString()}</b> from <b style={{ color: "var(--ink)" }}>{technicianName}</b>.</>
                  : <>The work will not proceed. {technicianName} will be notified and the booking cancelled.</>}
              </p>
              <div className="rounded-xl bg-surface-2 p-3 text-sm flex items-center justify-between">
                <span className="text-muted">Final price</span>
                <span className="font-semibold">₱{total.toLocaleString()}</span>
              </div>
              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>
            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" onClick={() => setConfirming(null)} disabled={busy} className="btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={() => decide(confirming)} disabled={busy} className={confirming === "approve" ? "btn-primary flex-1" : "btn-danger flex-1"}>
                {busy ? "…" : confirming === "approve" ? "Yes, approve" : "Yes, decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}