"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"

const CATEGORIES = [
  { key: "workmanship",    label: "Workmanship",    hint: "Quality of the repair" },
  { key: "punctuality",    label: "Punctuality",    hint: "On-time arrival" },
  { key: "cleanliness",    label: "Cleanliness",    hint: "Left the place tidy" },
  { key: "price_fairness", label: "Price fairness", hint: "Value for what you paid" },
] as const

type CategoryKey = typeof CATEGORIES[number]["key"]
type Scores = Record<CategoryKey, number>

export type ExistingReview = {
  id: string
  avg_rating: number | null
  text: string | null
  workmanship: number | null
  punctuality: number | null
  cleanliness: number | null
  price_fairness: number | null
}

function StarPicker({
  value,
  onChange,
  size = 28,
  disabled = false,
}: {
  value: number
  onChange: (n: number) => void
  size?: number
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className="transition active:scale-90 disabled:opacity-50"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          <svg
            viewBox="0 0 24 24"
            width={size} height={size}
            fill={n <= value ? "var(--warn)" : "none"}
            stroke={n <= value ? "var(--warn)" : "var(--line)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export function RateTechnician({
  bookingId,
  technicianName,
  existing,
}: {
  bookingId: string
  technicianName: string
  existing?: ExistingReview | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isEdit = !!existing

  const [overall, setOverall] = useState(existing?.avg_rating || 0)
  const [scores, setScores] = useState<Scores>({
    workmanship:    existing?.workmanship    || 0,
    punctuality:    existing?.punctuality    || 0,
    cleanliness:    existing?.cleanliness    || 0,
    price_fairness: existing?.price_fairness || 0,
  })
  const [text, setText] = useState(existing?.text || "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setOverallAndSync(n: number) {
    setOverall(n)
    setScores((prev) => ({
      workmanship:    prev.workmanship    === 0 ? n : prev.workmanship,
      punctuality:    prev.punctuality    === 0 ? n : prev.punctuality,
      cleanliness:    prev.cleanliness    === 0 ? n : prev.cleanliness,
      price_fairness: prev.price_fairness === 0 ? n : prev.price_fairness,
    }))
  }

  function setCategory(key: CategoryKey, n: number) {
    setScores((prev) => ({ ...prev, [key]: n }))
  }

  function openModal() {
    if (existing) {
      setOverall(existing.avg_rating || 0)
      setScores({
        workmanship:    existing.workmanship    || 0,
        punctuality:    existing.punctuality    || 0,
        cleanliness:    existing.cleanliness    || 0,
        price_fairness: existing.price_fairness || 0,
      })
      setText(existing.text || "")
    }
    setError(null)
    setOpen(true)
  }

  function close() {
    if (busy) return
    setOpen(false)
    setError(null)
  }

  async function submit() {
    setError(null)
    if (overall < 1) {
      setError("Tap the overall star rating to continue.")
      return
    }
    for (const c of CATEGORIES) {
      if (scores[c.key] < 1) {
        setError(`Please rate "${c.label}".`)
        return
      }
    }

    setBusy(true)
    try {
      const payload = {
        workmanship:    scores.workmanship,
        punctuality:    scores.punctuality,
        cleanliness:    scores.cleanliness,
        price_fairness: scores.price_fairness,
        avg_rating:     overall,
        text: text.trim() || null,
      }

      if (isEdit && existing) {
        const { data: updated, error: err } = await supabase
          .from("reviews")
          .update(payload)
          .eq("id", existing.id)
          .select("id")
          .maybeSingle()
        if (err) throw new Error("Update failed: " + err.message)
        if (!updated) throw new Error("Update blocked — check RLS on reviews table.")
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not signed in")

        const { data: booking, error: bErr } = await supabase
          .from("bookings")
          .select("technician_id, customer_id")
          .eq("id", bookingId)
          .single()
        if (bErr) throw bErr
        if (!booking?.technician_id) throw new Error("Booking has no technician")

        const { error: insErr } = await supabase.from("reviews").insert({
          booking_id: bookingId,
          customer_id: user.id,
          technician_id: booking.technician_id,
          ...payload,
        })
        if (insErr) throw insErr
      }

      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save review")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={isEdit ? "btn-secondary w-full" : "btn-primary w-full"}
      >
        {isEdit ? "Edit your review" : `Rate ${technicianName}`}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b border-line flex items-center justify-between sticky top-0 bg-surface z-10">
              <div>
                <p className="font-semibold text-sm">
                  {isEdit ? "Edit your review" : "Rate your technician"}
                </p>
                <p className="text-xs text-muted mt-0.5">{technicianName}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="icon-btn"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Overall */}
              <div>
                <p className="input-label mb-2">Overall rating</p>
                <div className="flex justify-center">
                  <StarPicker value={overall} onChange={setOverallAndSync} size={40} />
                </div>
                {overall > 0 && (
                  <p className="text-center text-xs mt-2" style={{ color: "var(--warn)" }}>
                    {overall === 1 ? "Poor" : overall === 2 ? "Fair" : overall === 3 ? "Good" : overall === 4 ? "Very good" : "Excellent"}
                  </p>
                )}
              </div>

              {/* Categories */}
              <div>
                <p className="input-label mb-1">Rate each aspect</p>
                <p className="text-[11px] text-muted mb-3 leading-relaxed">
                  Auto-filled from your overall rating — tap any star to fine-tune.
                </p>
                <div className="space-y-3">
                  {CATEGORIES.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{c.label}</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">{c.hint}</p>
                      </div>
                      <StarPicker
                        value={scores[c.key]}
                        onChange={(n) => setCategory(c.key, n)}
                        size={24}
                        disabled={busy}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="input-label">Tell us more (optional)</label>
                <textarea
                  rows={3}
                  className="input text-sm"
                  placeholder="What went well? What could have been better?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={busy}
                />
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3 sticky bottom-0 bg-surface">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="btn-secondary flex-1 !py-2.5 !text-[15px] whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || overall < 1}
                className="btn-primary flex-1 !py-2.5 !text-[15px] whitespace-nowrap disabled:opacity-50"
              >
                {busy ? "Saving…" : isEdit ? "Update review" : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}