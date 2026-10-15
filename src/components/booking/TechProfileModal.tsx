"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon, ApplianceIcon } from "@/lib/icons"
import { SERVICES } from "@/lib/booking/constants"

type Review = {
  id: string
  avg_rating: number | null
  workmanship: number | null
  punctuality: number | null
  cleanliness: number | null
  price_fairness: number | null
  text: string | null
  customer_name: string | null
  service_label: string | null
  created_at: string
}

type Props = {
  techId: string
  techName: string
  rating: number | null
  jobsCompleted: number | null
  yearsExperience: number | null
  barangay: string | null
  city: string | null
  province: string | null
  services: string[]
  distanceKm: number
  isSelected?: boolean
  onClose: () => void
  onSelect?: () => void
}

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  if (s < 604800) return Math.floor(s / 86400) + "d ago"
  if (s < 2592000) return Math.floor(s / 604800) + "w ago"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function barColor(v: number) {
  if (v >= 4) return "var(--success)"
  if (v >= 3) return "var(--warn)"
  return "var(--danger)"
}

export function TechProfileModal({
  techId, techName, rating, jobsCompleted, yearsExperience,
  barangay, city, province, services, distanceKm,
  isSelected = false, onClose, onSelect,
}: Props) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, avg_rating, workmanship, punctuality, cleanliness, price_fairness, text, customer_name, service_label, created_at")
        .eq("technician_id", techId)
        .order("created_at", { ascending: false })
        .limit(5)
      if (!cancelled) setReviews(data || [])
    })()
    return () => { cancelled = true }
  }, [techId, supabase])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const catAvg = (k: keyof Review) => {
    if (!reviews || reviews.length === 0) return 0
    const vals = reviews.map((r) => Number(r[k] || 0)).filter((v) => v > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  const overall = rating ?? 0
  const totalReviews = reviews?.length ?? 0
  const location = [province, city, barangay].filter(Boolean).join(" · ")
  const isNewTech = (jobsCompleted ?? 0) < 5

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-lg overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-line shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 text-base"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {techName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-base font-semibold text-ink truncate">{techName}</p>
                <span title="TESDA-verified technician" aria-label="TESDA-verified technician" style={{ display: "inline-flex" }}>
                  <Icon name="shieldCheck" className="w-4 h-4 text-[var(--success)] shrink-0" />
                </span>
                {isNewTech && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
                  >
                    New technician
                  </span>
                )}
              </div>
              {location && <p className="text-xs text-muted mt-0.5 truncate">{location}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-btn shrink-0 !w-9 !h-9" aria-label="Close">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--surface-2)" }}>
              {overall > 0 ? (
                <div className="flex items-center justify-center gap-1">
                  <Icon name="star" className="w-4 h-4" style={{ color: "var(--warn)" }} />
                  <span className="text-2xl font-semibold text-ink">{overall.toFixed(1)}</span>
                  <span className="text-xs text-muted">/ 5</span>
                </div>
              ) : (
                <p className="text-2xl font-semibold text-muted">—</p>
              )}
              <p className="text-[10px] uppercase tracking-wider text-muted mt-1">Rating</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--surface-2)" }}>
              <p className="text-2xl font-semibold text-ink">{jobsCompleted ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted mt-1">Jobs done</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--surface-2)" }}>
              <p className="text-2xl font-semibold text-ink">{distanceKm > 0 ? distanceKm.toFixed(1) : "0.0"}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted mt-1">km away</p>
            </div>
          </div>

          {/* Rating breakdown */}
          {totalReviews > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink/70 font-semibold mb-3">
                Rating breakdown ({totalReviews} review{totalReviews === 1 ? "" : "s"})
              </p>
              <div className="space-y-2">
                {([
                  ["Workmanship", "workmanship"],
                  ["Punctuality", "punctuality"],
                  ["Cleanliness", "cleanliness"],
                  ["Price fairness", "price_fairness"],
                ] as const).map(([label, key]) => {
                  const v = catAvg(key)
                  const color = barColor(v)
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-28 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                        <div style={{ width: `${(v / 5) * 100}%`, height: "100%", background: color, transition: "width 250ms ease" }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right shrink-0" style={{ color }}>
                        {v ? v.toFixed(1) : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Services offered */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/70 font-semibold mb-3">
              Services offered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {services.map((label) => {
                const svcDef = SERVICES.find((s) => s.label === label)
                return (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--ink)" }}
                  >
                    {svcDef && <ApplianceIcon id={svcDef.id} className="w-3.5 h-3.5" />}
                    {label}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Recent reviews */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/70 font-semibold mb-3">
              Recent reviews
            </p>
            {reviews === null ? (
              <p className="text-xs text-muted">Loading...</p>
            ) : totalReviews === 0 ? (
              <p className="text-xs text-muted">No reviews yet. Be the first to book and rate.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--warn)" }}>
                        {"★".repeat(Math.round(Number(r.avg_rating || 0)))}
                        <span style={{ color: "var(--line-2)" }}>
                          {"★".repeat(5 - Math.round(Number(r.avg_rating || 0)))}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted" title={fullDate(r.created_at)}>
                        {relTime(r.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-ink mb-1">
                      {r.customer_name || "Verified customer"}
                    </p>
                    {r.service_label && (() => {
                      const first = r.service_label.split(" + ")[0]
                      const svcDef = SERVICES.find((s) => s.label === first)
                      return (
                        <div className="flex items-center gap-1.5 mb-2">
                          {svcDef && <ApplianceIcon id={svcDef.id} className="w-3.5 h-3.5 text-[var(--accent)]" />}
                          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--accent)" }}>
                            {r.service_label} repair
                          </span>
                        </div>
                      )
                    })()}
                    {r.text ? (
                      <p className="text-xs text-muted leading-relaxed italic">"{r.text}"</p>
                    ) : (
                      <p className="text-xs text-muted italic opacity-70">No comment left.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {yearsExperience != null && yearsExperience > 0 && (
            <p className="text-xs text-muted">
              <span className="font-medium text-ink">{yearsExperience} year{yearsExperience === 1 ? "" : "s"}</span> of experience
            </p>
          )}
        </div>

        {/* Footer CTA */}
        {onSelect && (
          <div className="p-4 border-t border-line shrink-0">
            <button
              type="button"
              onClick={onSelect}
              className="w-full py-3 rounded-xl text-sm font-medium transition"
              style={{
                background: isSelected ? "var(--surface-2)" : "var(--accent)",
                color: isSelected ? "var(--ink)" : "#fff",
                cursor: "pointer",
              }}
            >
              {isSelected ? "✓ Selected — tap to confirm" : "Select this technician"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
