"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"

type Message = {
  id: string
  booking_id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
}

type Props = {
  open: boolean
  onClose: () => void
  bookingId: string
  meId: string
  partnerId: string
  partnerName: string
  partnerRole: string
}

type ChatTheme = {
  id: string
  name: string
  bg: string
  myBubble: string
  myText: string
  theirBubble: string
  theirText: string
  headerBg: string
  headerText: string
  inputBg: string
  inputText: string
  inputBorder: string
  accent: string
  avatarBg: string
  avatarText: string
}

const THEMES: ChatTheme[] = [
  {
    id: "default",
    name: "Default",
    bg: "var(--paper)",
    myBubble: "var(--accent)",
    myText: "#fff",
    theirBubble: "var(--surface-2)",
    theirText: "var(--ink)",
    headerBg: "var(--surface)",
    headerText: "var(--ink)",
    inputBg: "var(--surface)",
    inputText: "var(--ink)",
    inputBorder: "var(--line-2)",
    accent: "var(--accent)",
    avatarBg: "var(--accent-soft)",
    avatarText: "var(--accent)",
  },
  {
    id: "telegram",
    name: "Telegram",
    bg: "#E4EBF2",
    myBubble: "#4CA5E8",
    myText: "#fff",
    theirBubble: "#FFFFFF",
    theirText: "#1C2733",
    headerBg: "#517DA2",
    headerText: "#ffffff",
    inputBg: "#FFFFFF",
    inputText: "#1C2733",
    inputBorder: "rgba(81,125,162,.18)",
    accent: "#4CA5E8",
    avatarBg: "rgba(255,255,255,.25)",
    avatarText: "#ffffff",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    bg: "#ECE5DD",
    myBubble: "#DCF8C6",
    myText: "#111111",
    theirBubble: "#FFFFFF",
    theirText: "#111111",
    headerBg: "#075E54",
    headerText: "#ffffff",
    inputBg: "#FFFFFF",
    inputText: "#111111",
    inputBorder: "rgba(0,0,0,.08)",
    accent: "#25D366",
    avatarBg: "rgba(255,255,255,.25)",
    avatarText: "#ffffff",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "#0F0B1E",
    myBubble: "#7C5CFF",
    myText: "#ffffff",
    theirBubble: "#221B3D",
    theirText: "#E6E0FF",
    headerBg: "#1A0F2E",
    headerText: "#E6E0FF",
    inputBg: "#221B3D",
    inputText: "#E6E0FF",
    inputBorder: "rgba(124,92,255,.25)",
    accent: "#7C5CFF",
    avatarBg: "rgba(255,255,255,.15)",
    avatarText: "#E6E0FF",
  },
]

const THEME_KEY = "fixlink.chat.theme"

function loadStoredTheme(): ChatTheme {
  try {
    const id = localStorage.getItem(THEME_KEY)
    return THEMES.find((t) => t.id === id) || THEMES[0]
  } catch {
    return THEMES[0]
  }
}

export function ChatModal({ open, onClose, bookingId, meId, partnerId, partnerName, partnerRole }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ChatTheme>(THEMES[0])
  const [showThemes, setShowThemes] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setTheme(loadStoredTheme()) }, [])

  function pickTheme(t: ChatTheme) {
    setTheme(t)
    try { localStorage.setItem(THEME_KEY, t.id) } catch {}
    setShowThemes(false)
  }

  // Load history
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .or(`and(sender_id.eq.${meId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${meId})`)
        .order("created_at", { ascending: true })
      if (!cancelled) {
        setMessages(data || [])
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, bookingId, meId, partnerId, supabase])

  // Realtime
  useEffect(() => {
    if (!open) return
    const channel = supabase
      .channel("chat:" + bookingId + ":" + meId + ":" + partnerId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "booking_id=eq." + bookingId,
      }, (payload) => {
        const m = payload.new as Message
        const isMine = m.sender_id === meId && m.recipient_id === partnerId
        const isTheirs = m.sender_id === partnerId && m.recipient_id === meId
        if (!isMine && !isTheirs) return
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev
          if (isMine) {
            const tempIdx = prev.findIndex(
              (x) => x.id.startsWith("temp-") && x.body === m.body && x.sender_id === meId
            )
            if (tempIdx >= 0) {
              const next = [...prev]
              next[tempIdx] = m
              return next
            }
          }
          return [...prev, m]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, bookingId, meId, partnerId, supabase])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function send() {
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    const optimistic: Message = {
      id: "temp-" + Date.now(),
      booking_id: bookingId,
      sender_id: meId,
      recipient_id: partnerId,
      body,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setInput("")
    try {
      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({
          booking_id: bookingId,
          sender_id: meId,
          recipient_id: partnerId,
          body,
        })
        .select()
        .single()
      if (error) throw error
      if (inserted) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? (inserted as Message) : m)))
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setInput(body)
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex sm:items-center sm:justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: theme.bg }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0 relative"
          style={{ background: theme.headerBg, color: theme.headerText, borderBottom: "1px solid " + theme.inputBorder }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0"
            style={{ background: theme.avatarBg, color: theme.avatarText }}
          >
            {partnerName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{partnerName}</p>
            <p className="text-xs opacity-75 truncate">{partnerRole}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowThemes((v) => !v)}
            style={{ all: "unset", cursor: "pointer", padding: 6, display: "inline-flex", color: "inherit" }}
            aria-label="Chat settings"
          >
            <Icon name="settings" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ all: "unset", cursor: "pointer", padding: 6, display: "inline-flex", color: "inherit" }}
            aria-label="Close"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>

          {showThemes && (
            <div
              className="absolute top-full right-3 mt-2 p-3 rounded-xl shadow-lg z-20"
              style={{ background: theme.headerBg, color: theme.headerText, border: "1px solid " + theme.inputBorder }}
            >
              <p className="text-xs opacity-75 mb-2 px-1">Chat theme</p>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTheme(t)}
                    title={t.name}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: t.myBubble,
                      border: theme.id === t.id ? "2px solid " + theme.headerText : "2px solid transparent",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {theme.id === t.id && (
                      <Icon name="check" className="w-4 h-4" style={{ color: t.myText === "#fff" ? "#fff" : "#111" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{ background: theme.bg }}
          onClick={() => showThemes && setShowThemes(false)}
        >
          {loading ? (
            <p className="text-center text-xs py-8" style={{ color: "var(--muted)" }}>Loading…</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                style={{ background: theme.theirBubble, color: theme.theirText }}
              >
                <Icon name="chat" className="w-6 h-6" />
              </div>
              <p className="text-sm" style={{ color: theme.theirText }}>Start the conversation</p>
              <p className="text-xs mt-1 opacity-60" style={{ color: theme.theirText }}>Coordinate arrival, landmarks, or anything else.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === meId
              return (
                <div key={m.id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                  <div
                    className="max-w-[78%] px-3.5 py-2 text-sm shadow-sm"
                    style={{
                      background: isMine ? theme.myBubble : theme.theirBubble,
                      color: isMine ? theme.myText : theme.theirText,
                      borderRadius: 16,
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: isMine ? 16 : 4,
                    }}
                  >
                    <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</p>
                    <p className="text-[10px] mt-1 opacity-60 text-right">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Input */}
        <div
          className="p-3 shrink-0 flex gap-2 items-center"
          style={{ background: theme.inputBg, borderTop: "1px solid " + theme.inputBorder }}
        >
          <input
            type="text"
            placeholder="Message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            autoFocus
            style={{
              flex: 1,
              background: theme.inputBg,
              color: theme.inputText,
              border: "1px solid " + theme.inputBorder,
              borderRadius: 999,
              padding: "10px 16px",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            style={{
              all: "unset",
              cursor: sending || !input.trim() ? "not-allowed" : "pointer",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: theme.accent,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Icon name="chat" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}