"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"
import { ChatModal } from "@/components/chat/ChatModal"

type Props = {
  bookingId: string
  partnerId: string
  partnerName: string
  partnerRole: string
  variant?: "icon" | "text"
  initialUnread?: number
}

export function ChatButton({
  bookingId,
  partnerId,
  partnerName,
  partnerRole,
  variant = "icon",
  initialUnread = 0,
}: Props) {
  const supabase = createClient()
  const [meId, setMeId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)

  // Keep in sync when the server re-renders with fresh counts
  useEffect(() => { setUnread(initialUnread) }, [initialUnread])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMeId(user?.id || null)
    })()
  }, [supabase])

  useEffect(() => {
    if (!meId) return
    let cancelled = false

    async function load() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", bookingId)
        .eq("recipient_id", meId)
        .eq("sender_id", partnerId)
        .is("read_at", null)
      if (!cancelled) setUnread(count || 0)
    }

    const ch = supabase
      .channel("chatbtn:" + bookingId + ":" + meId + ":" + partnerId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: "booking_id=eq." + bookingId,
        },
        () => load()
      )
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [supabase, bookingId, meId, partnerId])

  // Clear locally when the modal opens — the modal marks rows read
  useEffect(() => { if (open) setUnread(0) }, [open])

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Message"
          style={{
            all: "unset",
            cursor: "pointer",
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--surface-3)",
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <Icon name="chat" className="w-4 h-4" />
          {unread > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "var(--danger)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-secondary text-xs py-2 px-3 relative"
        >
          <Icon name="chat" className="w-4 h-4" />
          Message
          {unread > 0 && (
            <span
              className="ml-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold inline-flex items-center justify-center"
              style={{ background: "var(--danger)", color: "#fff" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {open && meId && (
        <ChatModal
          open={open}
          onClose={() => setOpen(false)}
          bookingId={bookingId}
          meId={meId}
          partnerId={partnerId}
          partnerName={partnerName}
          partnerRole={partnerRole}
        />
      )}
    </>
  )
}
