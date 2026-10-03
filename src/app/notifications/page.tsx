"use client"

import { useEffect, useState } from "react"
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

export default function NotificationsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Notif[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      setUserId(user.id)

      const { data } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200)

      if (!cancelled) setItems(data || [])
    }

    load()

    const ch = supabase
      .channel("notif-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => load()
      )
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [supabase])

  async function markAllRead() {
    if (!userId) return
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("read", false)
    setItems((prev) => (prev || []).map((n) => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setItems((prev) => (prev || []).map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  if (items === null) {
    return <p className="text-sm text-muted">Loading…</p>
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold mb-2 tracking-tight">Notifications</h1>
          <p className="text-muted">
            {unread > 0 ? unread + " unread · " : ""}
            {items.length} total
          </p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={markAllRead} className="btn-secondary text-sm py-2 px-4">
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
            }}
          >
            <Icon name="bell" className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-ink mb-1">You are all caught up</p>
          <p className="text-xs text-muted">New activity will show up here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {items.map((n) => {
              const meta = (n.kind && META[n.kind]) || { icon: "bell" as IconName, color: "var(--muted)" }
              const isUnread = !n.read
              return (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => markRead(n.id)}
                  className="flex items-start gap-3.5 p-4 hover:bg-surface-2 transition"
                  style={isUnread ? { background: "color-mix(in srgb, var(--accent) 5%, transparent)" } : undefined}
                >
                  <span
                    className="shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 40, height: 40,
                      background: "color-mix(in srgb, " + meta.color + " 12%, transparent)",
                      color: meta.color,
                    }}
                    aria-hidden
                  >
                    <Icon name={meta.icon} className="w-4 h-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink truncate">{n.title || "Notification"}</p>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    )}
                  </div>

                  <span className="text-[11px] text-muted shrink-0 mt-0.5">
                    {relTime(n.created_at)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
