"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"
import { peso } from "@/lib/format"

type Item = { label: string; amount: number }

export function QuoteComposer({ bookingId, customer, service }: { bookingId: string; customer: string; service: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([
    { label: "Labor", amount: 0 },
    { label: "Parts", amount: 0 },
  ])
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const commission = Math.round(total * 0.10)
  const net = total - commission

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, { label: "", amount: 0 }])
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (total <= 0) { setError("Add at least one item with an amount"); return }
    if (!note.trim()) { setError("Please explain why this cost is what it is — customers approve based on this."); return }
    const hasBlank = items.some((it) => it.label.trim() === "" && Number(it.amount) > 0)
    if (hasBlank) { setError("Every item with a price needs a description."); return }

    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { data: quote, error: qErr } = await supabase
        .from("quotes")
        .insert({ booking_id: bookingId, total, commission, status: "pending", note: note.trim() })
        .select("id")
        .single()
      if (qErr) throw qErr

      const rows = items
        .filter((i) => Number(i.amount) > 0)
        .map((i) => ({
          quote_id: quote.id,
          label: i.label.trim() || "Item",
          amount: Number(i.amount),
        }))
      const { error: iErr } = await supabase.from("quote_items").insert(rows)
      if (iErr) throw iErr

      await supabase.from("bookings").update({ status: "quote_pending" }).eq("id", bookingId)

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
        Send quote
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div>
                <p className="font-semibold text-sm">Send quotation</p>
                <p className="text-xs text-muted mt-0.5">{service} · {customer}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                You&apos;ve inspected the unit. Itemize the actual cost and explain why. The customer approves before work continues.
              </p>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_100px_24px] gap-2 items-center text-[10px] uppercase tracking-wider text-muted font-medium px-1">
                <span>Description</span>
                <span></span>
                <span className="text-right">Amount (₱)</span>
                <span></span>
              </div>

              {/* Line items */}
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_100px_24px] gap-2 items-center">
                    <input
                      type="text"
                      className="input text-sm w-full"
                      placeholder="e.g. Labor, Parts"
                      value={it.label}
                      onChange={(e) => updateItem(i, { label: e.target.value })}
                      style={{ color: "var(--ink)" }}
                    />
                    <span className="text-sm text-muted select-none">₱</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      className="input text-sm w-full text-right tabular-nums"
                      placeholder="0"
                      value={it.amount || ""}
                      onChange={(e) => updateItem(i, { amount: Number(e.target.value) || 0 })}
                      style={{ color: "var(--ink)" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      disabled={items.length <= 1}
                      className="text-muted hover:text-[var(--danger)] disabled:opacity-30 transition"
                      aria-label="Remove item"
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addItem} className="btn-link text-xs">
                + Add item
              </button>

              {/* Reason — required */}
              <div>
                <label className="input-label">Why this price? *</label>
                <textarea
                  rows={3}
                  className="input text-sm"
                  placeholder="e.g. The compressor is seized and needs replacing. Parts alone cost ₱600, plus 2 hrs labor."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
                  Customers see this before approving. Be specific about what failed and what&apos;s being replaced.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-surface-2 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total</span>
                  <span className="font-semibold tabular-nums">{peso(total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">FixLink commission (10%)</span>
                  <span className="tabular-nums">−{peso(commission)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-line">
                  <span>You receive</span>
                  <span className="tabular-nums" style={{ color: "var(--success)" }}>{peso(net)}</span>
                </div>
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1 !py-2.5 !text-[15px] whitespace-nowrap"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 !py-2.5 !text-[15px] whitespace-nowrap disabled:opacity-50"
                onClick={submit}
                disabled={busy || total <= 0 || !note.trim()}
              >
                {busy ? "Sending…" : "Send quotation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}