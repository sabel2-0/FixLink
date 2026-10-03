import { createClient } from "@/lib/supabase/server"
import { Stars } from "@/components/ui/Stars"
import { EmptyState } from "@/components/ui/EmptyState"
import { RealtimeRefresh } from "@/components/RealtimeRefresh"

export default async function ReviewsPage() {
  const supabase = await createClient()

  const [techsRes, reviewsRes] = await Promise.all([
    supabase
      .from("technician_profiles")
      .select("id, rating, jobs_completed, cert_status, profile:profiles!technician_profiles_id_fkey(full_name), technician_services(service)"),
    supabase
      .from("reviews")
      .select("id, avg_rating, text, created_at, workmanship, punctuality, cleanliness, price_fairness, technician_id, customer:profiles!reviews_customer_id_fkey(full_name), technician:technician_profiles!reviews_technician_id_fkey(profile:profiles!technician_profiles_id_fkey(full_name))")
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  const techs = techsRes.data ?? []
  const reviews = reviewsRes.data ?? []

  // Compute avg + review count per technician, keyed by tech id
  const techStats = new Map<string, { avg: number; count: number }>()
  for (const t of techs) {
    const rv = reviews.filter((r: any) => r.technician_id === t.id)
    const avg = t.rating != null
      ? Number(t.rating)
      : rv.length
        ? rv.reduce((s: number, r: any) => s + Number(r.avg_rating || 0), 0) / rv.length
        : 0
    techStats.set(t.id, { avg, count: rv.length })
  }

  // Sort techs: rating desc, then review count desc
  const techList = techs
    .map((t: any) => ({
      t,
      avg: techStats.get(t.id)?.avg || 0,
      count: techStats.get(t.id)?.count || 0,
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)

  const totalReviews = reviews.length
  const overallAvg = totalReviews
    ? reviews.reduce((s: number, r: any) => s + Number(r.avg_rating || 0), 0) / totalReviews
    : 0
  const withRating = techList.filter((x) => x.count > 0)
  const topRated = withRating[0]

  return (
    <div className="max-w-4xl">
      <RealtimeRefresh tables={["reviews", "technician_profiles"]} />
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Ratings</h1>
      <p className="text-muted mb-8">What other customers say about technicians on FixLink.</p>

      {/* Summary */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted font-medium mb-1.5">
              Average
            </p>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none mb-2">
              {totalReviews > 0 ? overallAvg.toFixed(1) : "—"}
            </p>
            <Stars avg={overallAvg} size={14} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted font-medium mb-1.5">
              Reviews
            </p>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">
              {totalReviews}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted font-medium mb-1.5">
              Top rated
            </p>
            {topRated ? (
              <>
                <p className="text-sm sm:text-base font-medium truncate mb-1">
                  {topRated.t.profile?.full_name}
                </p>
                <div className="flex items-center gap-2">
                  <Stars avg={topRated.avg} size={12} />
                  <span className="text-xs text-muted">{topRated.avg.toFixed(1)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">—</p>
            )}
          </div>
        </div>
      </div>

      {/* By technician */}
      <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
        By technician
      </h2>
      {techList.length === 0 ? (
        <div className="card mb-10">
          <EmptyState icon="users" title="No technicians yet" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {techList.map(({ t, count, avg }) => {
            const services = (t.technician_services || [])
              .map((s: any) => s.service)
              .join(", ")
            return (
              <div key={t.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-ink truncate">
                      {t.profile?.full_name || "Technician"}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {services || "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-semibold tracking-tight">
                      {count > 0 ? avg.toFixed(1) : "—"}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {count} review{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Stars avg={avg} size={13} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent */}
      <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
        Recent reviews
      </h2>
      {totalReviews === 0 ? (
        <div className="card">
          <EmptyState icon="star" title="No reviews yet" description="Reviews from completed jobs show up here." />
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">
                    {r.customer?.full_name || "Customer"}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {r.technician?.profile?.full_name || "—"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <Stars avg={Number(r.avg_rating || 0)} size={13} />
                  <span className="text-[10px] text-muted mt-1">
                    {Number(r.avg_rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>

              {r.text && (
                <p className="text-sm mt-3" style={{ color: "var(--ink)" }}>
                  {r.text}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-line">
                {(["workmanship", "punctuality", "cleanliness", "price_fairness"] as const).map((k) => {
                  const label = k.replace("_", " ")
                  const val = Number(r[k] || 0)
                  return (
                    <div key={k}>
                      <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">
                        {label}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Stars avg={val} size={10} />
                        <span className="text-sm font-medium text-ink tabular-nums">
                          {val || "—"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}