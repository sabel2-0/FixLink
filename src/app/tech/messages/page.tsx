import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/EmptyState"
import { ChatButton } from "@/components/chat/ChatButton"
import { RealtimeRefresh } from "@/components/RealtimeRefresh"
import { MarkMessagesRead } from "@/components/chat/MarkMessagesRead"

export default async function TechMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: assigned } = await supabase
    .from("bookings")
    .select("id, status, scheduled_date, scheduled_time, barangay, customer_id, booking_items(service)")
    .eq("technician_id", user.id)

  const { data: invitedRows } = await supabase
    .from("booking_requested_techs")
    .select("booking_id")
    .eq("technician_id", user.id)
  const invitedIds = (invitedRows || [])
    .map((r: any) => r.booking_id)
    .filter((id: string) => !(assigned || []).some((b: any) => b.id === id))

  const { data: invited } = invitedIds.length
    ? await supabase
        .from("bookings")
        .select("id, status, scheduled_date, scheduled_time, barangay, customer_id, booking_items(service)")
        .in("id", invitedIds)
    : { data: [] as any[] }

  const allBookings = [...(assigned || []), ...(invited || [])]

  const customerIds = [...new Set(allBookings.map((b: any) => b.customer_id).filter(Boolean))]
  const { data: customers } = customerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", customerIds)
    : { data: [] as any[] }
  const nameOf = (id: string) =>
    (customers || []).find((p: any) => p.id === id)?.full_name || "Customer"

  const bookingIds = allBookings.map((b: any) => b.id)
  const { data: allMessages } = bookingIds.length
    ? await supabase
        .from("messages")
        .select("booking_id, body, created_at, sender_id, recipient_id, read_at")
        .in("booking_id", bookingIds)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
    : { data: [] as any[] }

  const lastByBooking: Record<string, any> = {}
  const unreadByBooking: Record<string, number> = {}
  for (const m of allMessages || []) {
    if (!lastByBooking[m.booking_id]) lastByBooking[m.booking_id] = m
    if (m.recipient_id === user.id && !m.read_at) {
      unreadByBooking[m.booking_id] = (unreadByBooking[m.booking_id] || 0) + 1
    }
  }

  const sorted = [...allBookings].sort((a: any, b: any) => {
    const ta = lastByBooking[a.id]?.created_at || a.scheduled_date || ""
    const tb = lastByBooking[b.id]?.created_at || b.scheduled_date || ""
    return tb.localeCompare(ta)
  })

  return (
    <div>
      <RealtimeRefresh tables={["messages"]} />
      <MarkMessagesRead />
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Messages</h1>
      <p className="text-muted mb-6">Chat with customers about their bookings.</p>

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState icon="chat" title="No conversations yet" description="Messages will appear here once you have jobs or estimates." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {sorted.map((b: any) => {
              const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
              const last = lastByBooking[b.id]
              const preview = last?.body || "No messages yet"
              const isMine = last?.sender_id === user.id
              const unread = unreadByBooking[b.id] || 0
              return (
                <div
                  key={b.id}
                  className="p-4 flex items-center gap-3 hover:bg-surface-2 transition"
                  style={unread > 0 ? { background: "color-mix(in srgb, var(--accent) 6%, transparent)" } : undefined}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
                    {nameOf(b.customer_id).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={"text-sm truncate " + (unread > 0 ? "font-semibold text-ink" : "font-medium")}>{nameOf(b.customer_id)}</p>
                      {last && (
                        <p className="text-[11px] text-muted shrink-0">
                          {new Date(last.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 truncate">{services || "Service"} - {b.barangay}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: last ? "var(--ink)" : "var(--muted)", fontWeight: unread > 0 ? 600 : 400 }}>
                      {isMine && <span className="text-muted">You: </span>}
                      {preview}
                    </p>
                  </div>

                  <ChatButton
                    bookingId={b.id}
                    partnerId={b.customer_id}
                    partnerName={nameOf(b.customer_id)}
                    partnerRole={services + " - " + (b.barangay || "")}
                    variant="icon"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
