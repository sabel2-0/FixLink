import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Stars } from "@/components/ui/Stars"
import { EmptyState } from "@/components/ui/EmptyState"
import { RealtimeRefresh } from "@/components/RealtimeRefresh"

export default async function AdminReviewsPage() {
  const supabase = await createClient()

  const [techsRes, reviewsRes] = await Promise.all([
    supabase
      .from("technician_profiles")
      .select("id, rating, jobs_completed, cert_status, profile:profiles!technician_profiles_id_fkey(id, full_name, email), technician_services(service)"),
    supabase
      .from("reviews")
      .select(`
        id, avg_rating, text, created_at, workmanship, punctuality, cleanliness, price_fairness,
        technician_id, customer_id, booking_id,
        customer:profiles!reviews_customer_id_fkey(id, full_name),
        technician:technician_profiles!reviews_technician_id_fkey(
          id,
          profile:profiles!technician_profiles_id_fkey(id, full_name)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  const techs = techsRes.data ?? []
  const reviews = reviewsRes.data ?? []

  // Per-tech stats
  const statsById = new Map<string, { avg: number; count: number; last: string | null }>()
  for (const t of techs) {
    const rv = reviews.filter((r: any) => r.technician_id === t.id)
    const avg = rv.length
      ? rv.reduce((s: number, r: any) => s + Number(r.avg_rating || 0), 0) / rv.length
      : 0
    const last = rv.length ? rv[0].created_at : null
    statsById.set(t.id, { avg, count: rv.length, last })
  }

  const techList = techs
    .map((t: any) => ({
      t,
      avg: statsById.get(t.id)?.avg || 0,
      count: statsById.get(t.id)?.count || 0,
      last: statsById.get(t.id)?.last || null,
    }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg)

  const total = reviews.length
  const overallAvg = total
    ? reviews.reduce((s: number, r: any) => s + Number(r.avg_rating || 0), 0) / total
    : 0
  const lowRated = reviews.filter((r: any) => Number(r.avg_rating) <= 2).length

  // Average per category across ALL reviews
  const categories = ["workmanship", "punctuality", "cleanliness", "price_fairness"] as const
  const catAvg: Record<string, number> = {}
  for (const c of categories) {
    const vals = reviews.map((r: any) => Number(r[c])).filter((v) => !isNaN(v) && v > 0)
    catAvg[c] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  }

  return (
    <div className="max-w-5xl">
      <RealtimeRefresh tables={["reviews", "technician_profiles"]} />
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Ratings</h1>
      <p className="text-muted mb-8">Every review customers have left on FixLink.</p>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Total reviews</p>
          <p className="text-3xl font-semibold tracking-tight">{total}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Average</p>
          <p className="text-3xl font-semibold tracking-tight mb-1">
            {total > 0 ? overallAvg.toFixed(1) : "—"}
          </p>
          {total > 0 && <Stars avg={overallAvg} size={12} />}
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Low ratings</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: lowRated > 0 ? "var(--danger)" : "var(--ink)" }}>
            {lowRated}
          </p>
          <p className="text-xs text-muted mt-1">≤ 2 stars</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Technicians</p>
          <p className="text-3xl font-semibold tracking-tight">{techs.length}</p>
          <p className="text-xs text-muted mt-1">{techList.filter((x) => x.count > 0).length} rated</p>
        </div>
      </div>

      {/* Category averages */}
      {total > 0 && (
        <div className="card p-5 mb-8">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Platform averages</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div key={c}>
                <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">
                  {c.replace("_", " ")}
                </p>
                <p className="text-lg font-semibold text-ink tabular-nums">
                  {catAvg[c] > 0 ? catAvg[c].toFixed(1) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Techs table */}
      <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
        By technician
      </h2>
      {techList.length === 0 ? (
        <div className="card mb-10"><EmptyState icon="users" title="No technicians yet" /></div>
      ) : (
        <div className="card overflow-x-auto mb-10">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-line">
                <th className="p-4 font-medium">Technician</th>
                <th className="p-4 font-medium">Services</th>
                <th className="p-4 font-medium">Jobs</th>
                <th className="p-4 font-medium">Reviews</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Last review</th>
              </tr>
            </thead>
            <tbody>
              {techList.map(({ t, count, avg, last }) => {
                const services = (t.technician_services || []).map((s: any) => s.service).join(", ")
                return (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="p-4 font-medium text-ink">
                      {t.profile?.full_name || "Unnamed"}
                      {t.cert_status === "verified" && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }}>
                          verified
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted text-xs max-w-[200px] truncate">{services || "—"}</td>
                    <td className="p-4 text-ink tabular-nums">{t.jobs_completed || 0}</td>
                    <td className="p-4 text-ink tabular-nums">{count}</td>
                    <td className="p-4">
                      {count > 0 ? (
                        <div className="flex items-center gap-2">
                          <Stars avg={avg} size={11} />
                          <span className="text-ink tabular-nums">{avg.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-muted text-xs">
                      {last ? new Date(last).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent reviews */}
      <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
        Recent reviews ({total})
      </h2>
      {total === 0 ? (
        <div className="card">
          <EmptyState icon="star" title="No reviews yet" description="Reviews appear here as customers rate completed jobs." />
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => {
            const isLow = Number(r.avg_rating) <= 2
            return (
              <div
                key={r.id}
                className="card p-5"
                style={isLow ? { borderLeft: "3px solid var(--danger)" } : undefined}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      <span className="text-muted font-normal">Customer:</span>{" "}
                      {r.customer?.full_name || "—"}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      <span>Rated </span>
                      <span className="text-ink font-medium">
                        {r.technician?.profile?.full_name || "—"}
                      </span>
                      {" · "}
                      {new Date(r.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Stars avg={Number(r.avg_rating || 0)} size={13} />
                    <p className="text-[10px] text-muted mt-1">
                      {Number(r.avg_rating || 0).toFixed(1)} / 5
                    </p>
                  </div>
                </div>

                {r.text && (
                  <p className="text-sm mt-3" style={{ color: "var(--ink)" }}>
                    {r.text}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-line">
                  {categories.map((c) => (
                    <div key={c}>
                      <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">
                        {c.replace("_", " ")}
                      </p>
                      <p className="text-sm font-medium text-ink tabular-nums">
                        {r[c] ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}