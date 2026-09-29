"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

type Item = { label: string; amount: number }

export function QuoteComposer({ bookingId, customer, service }: { bookingId: string; customer: string; service: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([
    { label: "Labor", amount: 0 },
    { label: "Parts", amount: 0 },
  ])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const commission = Math.round(total * 0.10)

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function addItem() { setItems((prev) => [...prev, { label: "New item", amount: 0 }]) }
  function removeItem(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)) }

  async function submit() {
    if (total <= 0) { setError("Add at least one item with an amount"); return }
    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { data: quote, error: qErr } = await supabase
        .from("quotes")
        .insert({ booking_id: bookingId, total, commission, status: "pending" })
        .select("id")
        .single()
      if (qErr) throw qErr

      const rows = items.filter((i) => Number(i.amount) > 0).map((i) => ({
        quote_id: quote.id,
        label: i.label,
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
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
                You've inspected the unit. Itemize the actual cost. The customer approves before work continues.
              </p>

              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className="input flex-1 text-sm" style={{ color: "var(--ink)" }} placeholder="e.g. Labor, Parts, Cleaning fee" value={it.label} onChange={(e) => updateItem(i, { label: e.target.value })} />
                    <span className="text-sm text-muted">₱</span>
                    <input
                      className="input w-24 text-sm"
                      type="number"
                      inputMode="numeric"
                      value={it.amount || ""}
                      onChange={(e) => updateItem(i, { amount: Number(e.target.value) })}
                      placeholder="0"
                    />
                    <button type="button" onClick={() => removeItem(i)} className="text-muted shrink-0">
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addItem} className="btn-link text-xs">+ Add item</button>

              <div className="rounded-xl bg-surface-2 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-semibold">₱{total.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted">FixLink commission (10%)</span><span>₱{commission.toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t border-line"><span>You receive</span><span>₱{(total - commission).toLocaleString()}</span></div>
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="button" className="btn-primary flex-1" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send quotation"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}