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
}

export function ChatButton({ bookingId, partnerId, partnerName, partnerRole, variant = "icon" }: Props) {
  const supabase = createClient()
  const [meId, setMeId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMeId(user?.id || null)
    })()
  }, [supabase])

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
          }}
        >
          <Icon name="chat" className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-secondary text-xs py-2 px-3"
        >
          <Icon name="chat" className="w-4 h-4" />
          Message
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