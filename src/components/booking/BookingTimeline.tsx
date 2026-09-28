"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon, IconName } from "@/lib/icons"

type BookingEvent = {
  id: number
  booking_id: string
  from_status: string | null
  to_status: string
  actor_id: string | null
  actor_role: string | null
  note: string | null
  created_at: string
}

const STATUS_META: Record<string, { label: string; icon: IconName; color: string }> = {
  pending:              { label: "Request submitted",       icon: "clock",     color: "var(--warn)" },
  estimated:            { label: "Estimate received",       icon: "tag",       color: "var(--accent)" },
  confirmed:            { label: "Technician confirmed",    icon: "check",     color: "var(--accent)" },
  en_route:             { label: "Technician on the way",   icon: "pin",       color: "var(--accent)" },
  arrived:              { label: "Technician arrived",      icon: "pin",       color: "var(--accent)" },
  in_progress:          { label: "Work started",            icon: "wrench",    color: "var(--accent)" },
  quote_pending:        { label: "Quotation sent",          icon: "doc",       color: "var(--warn)" },
  awaiting_confirmation:{ label: "Waiting for your confirmation", icon: "clock", color: "var(--warn)" },
  completed:            { label: "Completed",               icon: "check",     color: "var(--success)" },
  cancelled:            { label: "Cancelled",               icon: "x",         color: "var(--danger)" },
  disputed:             { label: "Disputed",                icon: "alert",     color: "var(--danger)" },
}

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  return Math.floor(s / 86400) + "d ago"
}

function roleLabel(role: string | null) {
  if (!role) return "System"
  if (role === "customer") return "Customer"
  if (role === "technician") return "Technician"
  if (role === "admin") return "Admin"
  return role
}

export function BookingTimeline({ bookingId }: { bookingId: string }) {
  const supabase = createClient()
  const [events, setEvents] = useState<BookingEvent[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from("booking_events")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
      if (!cancelled) setEvents(data || [])
    })()
    return () => { cancelled = true }
  }, [bookingId, supabase])

  if (events === null) {
    return <p className="text-xs text-muted">Loading timeline…</p>
  }
  if (events.length === 0) {
    return <p className="text-xs text-muted">No activity yet.</p>
  }

  return (
    <ol className="relative pl-6" style={{ listStyle: "none" }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 8,
          top: 6,
          bottom: 6,
          width: 2,
          background: "var(--line-2, #2C2C2E)",
          borderRadius: 2,
        }}
      />
      {events.map((ev, idx) => {
        const meta = STATUS_META[ev.to_status] || { label: ev.to_status, icon: "info" as IconName, color: "var(--muted)" }
        const isLatest = idx === 0
        return (
          <li key={ev.id} className="relative pb-5 last:pb-0">
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: -22,
                top: 2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--surface, #1C1C1E)",
                border: "2px solid " + meta.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: meta.color,
              }}
            >
              <Icon name={meta.icon} className="w-2.5 h-2.5" />
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <p className={"text-sm " + (isLatest ? "font-semibold" : "")} style={{ color: "var(--ink)" }}>
                {meta.label}
              </p>
              <p className="text-xs text-muted shrink-0">{relTime(ev.created_at)}</p>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {roleLabel(ev.actor_role)}
              {ev.from_status && ev.from_status !== ev.to_status ? " · " + ev.from_status.replace(/_/g, " ") + " → " + ev.to_status.replace(/_/g, " ") : ""}
            </p>
            {ev.note && (
              <p className="text-xs mt-1 italic" style={{ color: "var(--ink-2)" }}>
                "{ev.note}"
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}