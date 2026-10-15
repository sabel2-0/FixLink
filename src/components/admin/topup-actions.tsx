"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"
import { confirmTopup, rejectTopup } from "@/app/actions/credit-actions"

export function TopupActions({ topupId }: { topupId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function onConfirm() {
    setBusy("confirm"); setError(null)
    const r = await confirmTopup(topupId)
    if (r.error) setError(r.error)
    else router.refresh()
    setBusy(null)
  }

  async function onReject() {
    setBusy("reject"); setError(null)
    const r = await rejectTopup(topupId, reason)
    if (r.error) setError(r.error)
    else { setShowReject(false); router.refresh() }
    setBusy(null)
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy !== null}
          className="btn-primary !py-1.5 !px-3 !text-xs"
        >
          {busy === "confirm" ? "..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={busy !== null}
          className="btn-secondary !py-1.5 !px-3 !text-xs"
          style={{ color: "var(--danger)" }}
        >
          Reject
        </button>
      </div>

      {showReject && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReject(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">Reject top-up</p>
              <button type="button" onClick={() => setShowReject(false)} className="icon-btn" aria-label="Close">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                Tell the technician why this top-up is being rejected. They&apos;ll see this message in their wallet page.
              </p>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Reference number not found in our GCash history"
                className="input text-sm"
              />
              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>
            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" onClick={() => setShowReject(false)} className="btn-secondary flex-1 !py-2.5 !text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={busy !== null || !reason.trim()}
                className="btn-primary flex-1 !py-2.5 !text-sm disabled:opacity-50"
                style={{ background: "var(--danger)" }}
              >
                {busy === "reject" ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
