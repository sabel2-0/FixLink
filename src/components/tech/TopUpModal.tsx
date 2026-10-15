"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"
import { SiteName, useSiteName } from "@/components/shared/SiteNameProvider"

const GCASH_NUMBER = process.env.NEXT_PUBLIC_FIXLINK_GCASH_NUMBER || "09171234567"
const GCASH_NAME   = process.env.NEXT_PUBLIC_FIXLINK_GCASH_NAME   || "FixLink Payments"
const MAYA_NUMBER  = process.env.NEXT_PUBLIC_FIXLINK_MAYA_NUMBER  || "09171234567"
const MAYA_NAME    = process.env.NEXT_PUBLIC_FIXLINK_MAYA_NAME    || "FixLink Payments"

type Props = {
  open: boolean
  onClose: () => void
}

export function TopUpModal({ open, onClose }: Props) {
  const siteName = useSiteName()
  const router = useRouter()
  const supabase = createClient()
  const [method, setMethod] = useState<"gcash" | "maya">("gcash")
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const numAmount = Number(amount) || 0
  const accountNumber = method === "gcash" ? GCASH_NUMBER : MAYA_NUMBER
  const accountName   = method === "gcash" ? GCASH_NAME : MAYA_NAME
  const qrData = encodeURIComponent(`${method.toUpperCase()} ${accountNumber} — ${accountName}`)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`

  function close() {
    if (busy) return
    setAmount("")
    setReference("")
    setNote("")
    setError(null)
    setSent(false)
    onClose()
  }

  async function submit() {
    setError(null)
    if (numAmount < 100) { setError("Minimum top-up is ₱100."); return }
    if (numAmount > 10000) { setError("Maximum top-up is ₱10,000."); return }
    if (!reference.trim()) { setError("Enter the reference number from your e-wallet receipt."); return }

    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error: insErr } = await supabase.from("credit_topups").insert({
        technician_id: user.id,
        amount: numAmount,
        method,
        reference: reference.trim(),
        note: note.trim() || null,
        status: "pending",
      })
      if (insErr) throw insErr

      setSent(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <p className="font-semibold text-sm">Top up wallet</p>
          <button type="button" onClick={close} className="icon-btn" aria-label="Close">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center">
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }}
            >
              <Icon name="check" className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium mb-1">Top-up submitted</p>
            <p className="text-xs text-muted leading-relaxed mb-5">
              Your top-up of ₱{numAmount.toLocaleString()} is pending admin confirmation.
              We&apos;ll add it to your wallet once verified.
            </p>
            <button type="button" onClick={close} className="btn-primary w-full !py-2.5 !text-sm">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="input-label">Amount (₱)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="input"
                />
                <p className="text-[11px] text-muted mt-1.5">Min ₱100 · Max ₱10,000</p>
              </div>

              <div>
                <label className="input-label">Send to</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["gcash", "maya"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className="rounded-xl p-3 text-sm font-medium transition text-center"
                      style={{
                        background: method === m ? "var(--accent-soft)" : "var(--surface-2)",
                        color: method === m ? "var(--accent)" : "var(--ink)",
                        border: method === m ? "2px solid var(--accent)" : "2px solid transparent",
                      }}
                    >
                      {m === "gcash" ? "GCash" : "Maya"}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "var(--surface-2)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`${siteName} payment QR`}
                  width={110}
                  height={110}
                  className="rounded-lg bg-white p-1.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1"><SiteName /> {method === "gcash" ? "GCash" : "Maya"}
                  </p>
                  <p className="text-sm font-semibold text-ink">{accountNumber}</p>
                  <p className="text-xs text-muted mt-0.5">{accountName}</p>
                  <p className="text-[11px] text-muted mt-2 leading-relaxed">
                    Send the exact amount, then copy the reference number below.
                  </p>
                </div>
              </div>

              <div>
                <label className="input-label">Reference number *</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="From your GCash/Maya receipt"
                  className="input"
                />
              </div>

              <div>
                <label className="input-label">Note (optional)</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the admin should know"
                  className="input"
                />
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" onClick={close} disabled={busy} className="btn-secondary flex-1 !py-2.5 !text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || numAmount < 100 || !reference.trim()}
                className="btn-primary flex-1 !py-2.5 !text-sm disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit top-up"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
