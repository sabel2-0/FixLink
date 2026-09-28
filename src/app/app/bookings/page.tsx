export const dynamic = "force-dynamic"

import Link from "next/link"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"

import { Badge } from "@/components/ui/Badge"
export const dynamic = "force-dynamic"

import { EmptyState } from "@/components/ui/EmptyState"
export const dynamic = "force-dynamic"

import { Icon } from "@/lib/icons"

const ACTIVE = ["pending","estimated","confirmed","en_route","arrived","in_progress","quote_pending","awaiting_confirmation"]
const HISTORY = ["completed","cancelled","disputed"]

function formatDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return h12 + ":" + m + " " + ampm
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "active" } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: all } = await supabase
    .from("bookings")
    .select(`
      id, status, scheduled_date, scheduled_time, final_amount, barangay, cancel_reason, cancelled_by,
      technician:technician_profiles!bookings_technician_id_fkey(profile:profiles!technician_profiles_id_fkey(full_name)),
      booking_items(service, problems)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  const bookings = all || []
  const activeList = bookings.filter((b: any) => ACTIVE.includes(b.status))
  const historyList = bookings.filter((b: any) => HISTORY.includes(b.status))
  const shown = tab === "active" ? activeList : tab === "history" ? historyList : bookings

  const tabs = [
    { key: "active", label: "Active", count: activeList.length },
    { key: "history", label: "History", count: historyList.length },
    { key: "all", label: "All", count: bookings.length },
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold mb-6 tracking-tight">Bookings</h1>

      <div className="seg max-w-md mb-6">
        {tabs.map((t) => (
          <Link key={t.key} href={"/app/bookings?tab=" + t.key} className={tab === t.key ? "active" : ""}>
            <span>{t.label}</span>
            <span className="seg-count">{t.count}</span>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {shown.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={
              tab === "active"
                ? "No active bookings"
                : tab === "history"
                  ? "No history yet"
                  : "No bookings yet"
            }
            description={
              tab === "active"
                ? "Start one from the Book a service page."
                : tab === "history"
                  ? "Completed and cancelled bookings will appear here."
                  : "Start one from the Book a service page."
            }
          />
        ) : (
          <div className="divide-y divide-line">
            {shown.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const tech = b.technician?.profile?.full_name
              const title = (services || "Service") + (tech ? " · " + tech : "")
              const isTerminal = HISTORY.includes(b.status)
              return (
                <Link
                  key={b.id}
                  href={"/app/bookings/" + b.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-surface-2 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {services || "Service"}
                      {tech ? <span className="text-muted font-normal"> · {tech}</span> : null}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatDate(b.scheduled_date)}
                      {b.scheduled_time ? " · " + formatTime(b.scheduled_time) : ""}
                      {b.barangay ? " · " + b.barangay : ""}
                    </p>
                    {b.status === "cancelled" && b.cancel_reason && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--danger)" }}>
                        "{b.cancel_reason}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {b.final_amount && (
                      <span className="text-sm font-medium">₱{Number(b.final_amount).toLocaleString()}</span>
                    )}
                    <Badge status={b.status} />
                    <Icon name="chevron" className="w-4 h-4 text-muted" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}