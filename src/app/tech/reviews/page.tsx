import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RealtimeRefresh } from "@/components/RealtimeRefresh"

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  return Math.floor(s / 86400) + "d ago"
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value)
  return (
    <span style={{ color: "var(--warn)" }}>
      {"★".repeat(rounded)}
      <span style={{ color: "var(--line-2)" }}>
        {"★".repeat(5 - rounded)}
      </span>
    </span>
  )
}

export default async function TechReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: techProfile } = await supabase
    .from("technician_profiles")
    .select("rating, jobs_completed")
    .eq("id", user.id)
    .maybeSingle()

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id, avg_rating, workmanship, punctuality, cleanliness, price_fairness, text, created_at,
      customer:profiles!reviews_customer_id_fkey(full_name),
      booking:bookings!reviews_booking_id_fkey(id, booking_items(service))
    `)
    .eq("technician_id", user.id)
    .order("created_at", { ascending: false })

  const list = reviews ?? []
  const totalReviews = list.length
  const overallAvg = totalReviews
    ? list.reduce((s: number, r: any) => s + Number(r.avg_rating || 0), 0) / totalReviews
    : null

  // Category averages
  const categories = [
    { key: "workmanship",    label: "Workmanship" },
    { key: "punctuality",    label: "Punctuality" },
    { key: "cleanliness",    label: "Cleanliness" },
    { key: "price_fairness", label: "Price fairness" },
  ]
  const catAvg: Record<string, number> = {}
  for (const c of categories) {
    const vals = list.map((r: any) => Number(r[c.key])).filter((v) => !isNaN(v) && v > 0)
    catAvg[c.key] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  }

  return (
    <div className="max-w-3xl">
      <RealtimeRefresh tables={["reviews", "technician_profiles"]} />
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Reviews</h1>
      <p className="text-muted mb-8">What customers say about your work.</p>

      {/* Summary */}
      {totalReviews === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--warn)" }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-ink mb-1">No reviews yet</p>
          <p className="text-xs text-muted">
            Complete jobs and customers will rate you. Your reputation builds over time.
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Overall</p>
              <div className="flex items-end gap-3 mb-2">
                <p className="text-4xl font-semibold text-ink tracking-tight">
                  {overallAvg!.toFixed(1)}
                </p>
                <p className="text-sm text-muted mb-1">/ 5</p>
              </div>
              <p className="text-lg mb-1">
                <Stars value={overallAvg!} />
              </p>
              <p className="text-xs text-muted">
                {totalReviews} review{totalReviews === 1 ? "" : "s"}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">By category</p>
              <div className="space-y-2.5">
                {categories.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted text-xs">{c.label}</span>
                    <span className="text-ink font-medium tabular-nums">
                      {catAvg[c.key] > 0 ? catAvg[c.key].toFixed(1) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
            All reviews ({totalReviews})
          </h2>

          <div className="space-y-3">
            {list.map((r: any) => {
              const serviceLabel = (r.booking?.booking_items || [])
                .map((i: any) => i.service)
                .join(" + ")
              return (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {r.customer?.full_name || "Customer"}
                      </p>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {serviceLabel || "Service"} · {relTime(r.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm"><Stars value={Number(r.avg_rating || 0)} /></p>
                      <p className="text-xs text-muted mt-0.5">
                        {Number(r.avg_rating || 0).toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {r.text && (
                    <p className="text-sm mt-3" style={{ color: "var(--ink)" }}>
                      {r.text}
                    </p>
                  )}

                  {/* Category breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-line">
                    {categories.map((c) => (
                      <div key={c.key}>
                        <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">
                          {c.label}
                        </p>
                        <p className="text-sm font-medium text-ink tabular-nums">
                          {r[c.key] ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}