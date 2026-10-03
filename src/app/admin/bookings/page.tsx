import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/Badge"
import { BookingRealtimeRefresh } from "@/components/booking/BookingRealtimeRefresh"

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return h12 + ":" + m + " " + ampm
}

export default async function AdminBookingsPage() {
  const supabase = await createClient()

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id, status, scheduled_date, scheduled_time, barangay, final_amount, final_commission,
      created_at,
      customer:profiles!bookings_customer_id_fkey(full_name, email),
      technician:technician_profiles!bookings_technician_id_fkey(
        profile:profiles!technician_profiles_id_fkey(full_name)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[admin/bookings] query error:", error)
  }

  const rows = bookings ?? []

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-semibold mb-2 text-ink tracking-tight">Bookings</h1>
      <p className="text-muted mb-8">All job requests, newest first.</p>

      {/* Realtime refresh — refreshes the whole list when any booking changes */}
      {(rows || []).slice(0, 5).map((b: any) => (
        <BookingRealtimeRefresh key={"rt-" + b.id} bookingId={b.id} />
      ))}

      {error && (
        <div
          className="card p-4 mb-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            borderLeft: "3px solid var(--danger)",
            color: "var(--ink)",
          }}
        >
          <p className="font-medium mb-1" style={{ color: "var(--danger)" }}>Query error</p>
          <p className="text-muted text-xs font-mono">{error.message}</p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="p-4 font-medium">#</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Technician</th>
              <th className="p-4 font-medium">When</th>
              <th className="p-4 font-medium">Area</th>
              <th className="p-4 font-medium">Final</th>
              <th className="p-4 font-medium">Comm.</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-8 text-muted text-center" colSpan={8}>
                  No bookings yet.
                </td>
              </tr>
            ) : (
              rows.map((b: any) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="p-4 text-muted font-mono text-xs">
                    {String(b.id).slice(0, 8)}
                  </td>
                  <td className="p-4 text-ink font-medium">
                    {b.customer?.full_name || "—"}
                  </td>
                  <td className="p-4 text-ink">
                    {b.technician?.profile?.full_name || (
                      <span className="text-muted italic">unassigned</span>
                    )}
                  </td>
                  <td className="p-4 text-muted">
                    {fmtDate(b.scheduled_date)}
                    {b.scheduled_time ? ` · ${fmtTime(b.scheduled_time)}` : ""}
                  </td>
                  <td className="p-4 text-muted">{b.barangay || "—"}</td>
                  <td className="p-4 text-ink">
                    {b.final_amount ? `₱${Number(b.final_amount).toLocaleString()}` : "—"}
                  </td>
                  <td className="p-4 text-ink">
                    {b.final_commission ? `₱${Number(b.final_commission).toLocaleString()}` : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Badge status={b.status} />
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="text-xs text-accent hover:underline whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}