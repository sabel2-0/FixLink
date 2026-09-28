import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/EmptyState"
import { ChatButton } from "@/components/chat/ChatButton"

export default async function CustomerMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // My bookings (active or recent)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, scheduled_date, scheduled_time, barangay, technician_id, created_at, booking_items(service)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  const list = bookings || []
  const bookingIds = list.map((b: any) => b.id)

  // Invited techs per booking
  const { data: invitedRows } = bookingIds.length
    ? await supabase
        .from("booking_requested_techs")
        .select("booking_id, technician_id")
        .in("booking_id", bookingIds)
    : { data: [] as any[] }

  const invitedByBooking: Record<string, string[]> = {}
  for (const r of invitedRows || []) {
    if (!invitedByBooking[r.booking_id]) invitedByBooking[r.booking_id] = []
    invitedByBooking[r.booking_id].push(r.technician_id)
  }

  // Collect all tech IDs to fetch names
  const techIds = new Set<string>()
  for (const b of list) {
    if (b.technician_id) techIds.add(b.technician_id)
  }
  for (const ids of Object.values(invitedByBooking)) {
    for (const id of ids) techIds.add(id)
  }

  const { data: techs } = techIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", [...techIds])
    : { data: [] as any[] }
  const nameOf = (id: string) =>
    (techs || []).find((p: any) => p.id === id)?.full_name || "Technician"

  // Last message per (booking, tech) pair
  const { data: allMessages } = bookingIds.length
    ? await supabase
        .from("messages")
        .select("booking_id, sender_id, recipient_id, body, created_at")
        .in("booking_id", bookingIds)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
    : { data: [] as any[] }

  // Group by (booking_id + partner_id)
  type Thread = {
    key: string
    bookingId: string
    partnerId: string
    partnerName: string
    service: string
    barangay: string
    lastBody: string
    lastAt: string | null
    lastFromMe: boolean
    status: string
  }

  const threads: Record<string, Thread> = {}

  for (const b of list) {
    const services = (b.booking_items || []).map((i: any) => i.service).join(" + ")
    const partners = new Set<string>()
    if (b.technician_id) partners.add(b.technician_id)
    for (const id of invitedByBooking[b.id] || []) partners.add(id)
    for (const pid of partners) {
      const key = b.id + ":" + pid
      threads[key] = {
        key,
        bookingId: b.id,
        partnerId: pid,
        partnerName: nameOf(pid),
        service: services || "Service",
        barangay: b.barangay || "",
        lastBody: "No messages yet",
        lastAt: null,
        lastFromMe: false,
        status: b.status,
      }
    }
  }

  for (const m of allMessages || []) {
    const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id
    const key = m.booking_id + ":" + partnerId
    if (!threads[key]) continue
    if (!threads[key].lastAt || m.created_at > threads[key].lastAt!) {
      threads[key].lastBody = m.body
      threads[key].lastAt = m.created_at
      threads[key].lastFromMe = m.sender_id === user.id
    }
  }

  const sorted = Object.values(threads).sort((a, b) => {
    if (a.lastAt && b.lastAt) return b.lastAt.localeCompare(a.lastAt)
    if (a.lastAt) return -1
    if (b.lastAt) return 1
    return 0
  })

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Messages</h1>
      <p className="text-muted mb-6">Chat with the technicians you invited.</p>

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState icon="chat" title="No conversations yet" description="Start a booking to message a technician." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {sorted.map((t) => (
              <div key={t.key} className="p-4 flex items-center gap-3 hover:bg-surface-2 transition">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {t.partnerName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{t.partnerName}</p>
                    {t.lastAt && (
                      <p className="text-[11px] text-muted shrink-0">
                        {new Date(t.lastAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{t.service}{t.barangay ? " · " + t.barangay : ""}</p>
                  <p className="text-xs mt-1 truncate" style={{ color: t.lastAt ? "var(--ink)" : "var(--muted)" }}>
                    {t.lastFromMe && <span className="text-muted">You: </span>}
                    {t.lastBody}
                  </p>
                </div>
                <ChatButton
                  bookingId={t.bookingId}
                  partnerId={t.partnerId}
                  partnerName={t.partnerName}
                  partnerRole={t.service + (t.barangay ? " · " + t.barangay : "")}
                  variant="icon"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}