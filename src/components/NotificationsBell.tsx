"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Icon, IconName } from "@/lib/icons"

type Notif = {
  id: string
  kind: string | null
  title: string | null
  body: string | null
  link: string | null
  read: boolean | null
  created_at: string
}

const META: Record<string, { icon: IconName; color: string }> = {
  booking:      { icon: "calendar", color: "var(--accent)" },
  estimate:     { icon: "tag",      color: "var(--accent)" },
  quote:        { icon: "doc",      color: "var(--warn)" },
  payment:      { icon: "dollar",   color: "var(--success)" },
  review:       { icon: "star",     color: "var(--warn)" },
  message:      { icon: "chat",     color: "var(--muted)" },
  registration: { icon: "shield",   color: "var(--warn)" },
}

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  return Math.floor(s / 86400) + "d ago"
}

export function NotificationsBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notif[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      setUserId(user.id)

      const { data } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read, created_at", { head: false })
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (!cancelled) setItems(data || [])
    }

    load()

    const ch = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => load()
      )
      .subscribe()

    let pollCount = 0
    const poll = setInterval(() => {
      pollCount++
      // every ~30s, do a heavy refresh too
      if (pollCount % 6 === 0) console.log("[bell] poll tick", pollCount)
      load()
    }, 3000)
    return () => {
      cancelled = true
      clearInterval(poll)
      supabase.removeChannel(ch)
    }
  }, [supabase])

  const unreadCount = items.filter((n) => !n.read).length

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  async function markAllRead() {
    if (!userId) return
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("read", false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative icon-btn"
      >
        <Icon name="bell" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden shadow-lg z-50"
          style={{ background: "var(--surface)", border: "1px solid var(--line-2)" }}
        >
          <div className="p-3 border-b border-line flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink tracking-tight">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-[11px] text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted">No notifications yet.</p>
              </div>
            ) : (
              items.map((n) => {
                const meta = (n.kind && META[n.kind]) || { icon: "bell" as IconName, color: "var(--muted)" }
                const isUnread = !n.read
                return (
                  <Link
                    key={n.id}
                    href={n.link || "/notifications"}
                    onClick={() => markRead(n.id)}
                    className="block p-3 border-b border-line last:border-0 hover:bg-surface-2 transition"
                    style={isUnread ? { background: "color-mix(in srgb, var(--accent) 6%, transparent)" } : undefined}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: 28, height: 28,
                          background: "color-mix(in srgb, " + meta.color + " 12%, transparent)",
                          color: meta.color,
                        }}
                        aria-hidden
                      >
                        <Icon name={meta.icon} className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink leading-snug truncate">{n.title || "Notification"}</p>
                        {n.body && <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                        <p className="text-[10px] text-muted mt-1">{relTime(n.created_at)}</p>
                      </div>
                      {isUnread && (
                        <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          <div className="p-2 border-t border-line">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-accent py-2 rounded-lg hover:bg-surface-2 transition font-medium"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
