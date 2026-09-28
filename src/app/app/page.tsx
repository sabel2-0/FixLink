import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/lib/icons"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"

const TERMINAL = ["completed", "cancelled", "disputed"]

export default async function CustomerHome() {
  const supabase = await createClient()
  const res = await supabase.auth.getUser()
  const user = res.data.user
  if (!user) return null

  const pRes = await supabase.from("profiles").select("full_name").eq("id", user.id).single()
  const firstName = ((pRes.data && pRes.data.full_name) || "there").split(" ")[0]

  const bRes = await supabase
    .from("bookings")
    .select("id, status, scheduled_date, scheduled_time, final_amount, booking_items(service)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const all = bRes.data || []
  const active = all.filter((b: any) => TERMINAL.indexOf(b.status) === -1)
  const recent = all.filter((b: any) => TERMINAL.indexOf(b.status) > -1).slice(0, 3)

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold mb-1 tracking-tight">Hi, {firstName}.</h1>
      <p className="text-muted mb-10">Here is what is happening.</p>

      <Link href="/app/book" className="card p-6 mb-4 block hover:bg-surface-2 transition flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-medium mb-1">Need something fixed?</p>
          <p className="text-sm text-muted">Describe the issue and pick from multiple technicians.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
          <Icon name="plus" className="w-5 h-5" />
        </div>
      </Link>

      {active.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Active</h2>
          <div className="card divide-y divide-line">
            {active.map((b: any) => (
              <Link key={b.id} href={"/app/bookings/" + b.id} className="p-4 flex items-center justify-between gap-3 hover:bg-surface-2 transition">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {(b.booking_items || []).map((i: any) => i.service).join(" + ")}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{b.scheduled_date} · {b.scheduled_time}</p>
                </div>
                <Badge status={b.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-muted font-medium">Recent</h2>
            <Link href="/app/bookings" className="btn-link text-xs">View all</Link>
          </div>
          <div className="card divide-y divide-line">
            {recent.map((b: any) => (
              <Link key={b.id} href={"/app/bookings/" + b.id} className="p-4 flex items-center justify-between gap-3 hover:bg-surface-2 transition">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {(b.booking_items || []).map((i: any) => i.service).join(" + ")}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{b.scheduled_date}</p>
                </div>
                <Badge status={b.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {all.length === 0 && (
        <div className="card">
          <EmptyState icon="inbox" title="No bookings yet" description="Tap the card above to get started." />
        </div>
      )}
    </div>
  )
}
