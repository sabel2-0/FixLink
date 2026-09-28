import { createClient } from "@/lib/supabase/server"
import { Stars } from "@/components/ui/Stars"
import { EmptyState } from "@/components/ui/EmptyState"

export default async function ReviewsPage() {
  const supabase = await createClient()

  const { data: techs } = await supabase
    .from("technician_profiles")
    .select("id, rating, jobs_completed, cert_status, profile:profiles!technician_profiles_id_fkey(full_name), technician_services(service)")

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, avg_rating, text, created_at, workmanship, punctuality, cleanliness, price_fairness, customer:profiles!reviews_customer_id_fkey(full_name), technician:technician_profiles!reviews_technician_id_fkey(profile:profiles!technician_profiles_id_fkey(full_name))")
    .order("created_at", { ascending: false })
    .limit(30)

  const techList = (techs || []).map((t: any) => {
    const rv = (reviews || []).filter((r: any) => r.technician?.profile?.full_name === t.profile?.full_name)
    const avg = t.rating || (rv.length ? rv.reduce((s: number, r: any) => s + (r.avg_rating || 0), 0) / rv.length : 5)
    return { t, rvCount: rv.length, avg }
  }).sort((a, b) => b.avg - a.avg)

  const totalReviews = (reviews || []).length
  const overallAvg = totalReviews
    ? (reviews || []).reduce((s: number, r: any) => s + (r.avg_rating || 0), 0) / totalReviews
    : 5

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Ratings</h1>
      <p className="text-muted mb-8">What other customers say.</p>

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Average</p>
            <p className="text-4xl font-semibold tracking-tight">{overallAvg.toFixed(1)}</p>
            <Stars avg={overallAvg} size={14} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Reviews</p>
            <p className="text-4xl font-semibold tracking-tight">{totalReviews}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Top rated</p>
            <p className="text-base font-medium truncate">{techList[0]?.t?.profile?.full_name || "—"}</p>
            <Stars avg={techList[0]?.avg || 5} size={14} />
          </div>
        </div>
      </div>

      <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">By technician</h2>
      {techList.length === 0 ? (
        <div className="card mb-10"><EmptyState icon="users" title="No technicians yet" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {techList.map(({ t, rvCount, avg }) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-base font-medium truncate">{t.profile?.full_name}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {(t.technician_services || []).map((s: any) => s.service).join(", ")}
                  </p>
                </div>
                <p className="text-xl font-semibold tracking-tight">{avg.toFixed(1)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Stars avg={avg} size={12} />
                <p className="text-xs text-muted">{rvCount}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Recent</h2>
      {totalReviews === 0 ? (
        <div className="card"><EmptyState icon="star" title="No reviews yet" /></div>
      ) : (
        <div className="space-y-3">
          {(reviews || []).map((r: any) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.customer?.full_name || "Customer"}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {r.technician?.profile?.full_name || ""} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Stars avg={r.avg_rating || 0} size={12} />
              </div>
              {r.text && <p className="text-sm mt-2">{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
