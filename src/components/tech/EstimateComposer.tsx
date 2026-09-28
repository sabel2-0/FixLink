"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

type Props = {
  bookingId: string
  service: string
  customer: string
  barangay: string
  problems: string[]
}

export function EstimateComposer({ bookingId, service, customer, barangay, problems }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [eta, setEta] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return }
    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error: e } = await supabase.from("estimates").upsert({
        booking_id: bookingId,
        technician_id: user.id,
        amount: amt,
        eta_minutes: eta ? Number(eta) : null,
        note: note.trim() || null,
      }, { onConflict: "booking_id,technician_id" })
      if (e) throw e

      await supabase.rpc("mark_booking_estimated", { p_booking_id: bookingId })

      setOpen(false)
      setAmount(""); setEta(""); setNote("")
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
        Post estimate
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div>
                <p className="font-semibold text-sm">Post estimate</p>
                <p className="text-xs text-muted mt-0.5">{service} · {customer} · {barangay}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {problems.length > 0 && (
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted font-medium mb-1">Reported issues</p>
                  <p className="text-sm">{problems.join(", ")}</p>
                </div>
              )}

              <div>
                <label className="input-label">Estimated price</label>
                <input type="number" inputMode="numeric" className="input" placeholder="e.g. 800" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div>
                <label className="input-label">Estimated arrival (minutes, optional)</label>
                <input type="number" inputMode="numeric" className="input" placeholder="e.g. 30" value={eta} onChange={(e) => setEta(e.target.value)} />
              </div>

              <div>
                <label className="input-label">Note to customer (optional)</label>
                <textarea rows={3} className="input text-sm" placeholder="e.g. Standard cleaning if split-type; no freon needed" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="rounded-lg bg-accent-soft p-3 text-xs leading-relaxed" style={{ color: "var(--accent)" }}>
                This is an estimate only. Final price is confirmed after inspection.
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="button" className="btn-primary flex-1" onClick={submit} disabled={busy}>{busy ? "Posting…" : "Post estimate"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}