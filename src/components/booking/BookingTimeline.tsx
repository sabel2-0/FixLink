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

const STATUS_META: Record<string, { label: string; icon: IconName }> = {
  pending:               { label: "Request submitted",            icon: "clock" },
  estimated:             { label: "Estimate received",            icon: "tag" },
  confirmed:             { label: "Technician confirmed",         icon: "check" },
  en_route:              { label: "Technician on the way",        icon: "pin" },
  arrived:               { label: "Technician arrived",           icon: "pin" },
  in_progress:           { label: "Work started",                 icon: "wrench" },
  quote_pending:         { label: "Quotation sent",               icon: "doc" },
  awaiting_confirmation: { label: "Waiting for confirmation",     icon: "clock" },
  completed:             { label: "Job completed",                icon: "check" },
  cancelled:             { label: "Cancelled",                    icon: "x" },
  disputed:              { label: "Disputed",                     icon: "alert" },
}

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  return Math.floor(s / 86400) + "d ago"
}

function absTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Always show the actual actor name (never "You"). Falls back to role
// label if the profile lookup failed (deleted user or RLS block).
function actorLabel(
  actorId: string | null,
  role: string | null,
  names: Record<string, string>,
) {
  if (actorId && names[actorId]) return names[actorId]
  if (!role) return "System"
  if (role === "customer") return "Customer"
  if (role === "technician") return "Technician"
  if (role === "admin") return "Admin"
  return role
}

export function BookingTimeline({ bookingId }: { bookingId: string }) {
  const supabase = createClient()
  const [events, setEvents] = useState<BookingEvent[] | null>(null)
  const [actorNames, setActorNames] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      const { data } = await supabase
        .from("booking_events")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true })

      if (cancelled) return
      const list = data || []
      setEvents(list)

      // Fetch profiles for every actor in this timeline (customer, tech, admin)
      const ids = Array.from(
        new Set(list.map((e) => e.actor_id).filter((x): x is string => Boolean(x)))
      )
      if (ids.length === 0) return

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids)

      if (cancelled || !profiles) return
      const map: Record<string, string> = {}
      for (const p of profiles) map[p.id] = p.full_name || "User"
      setActorNames(map)
    }

    fetchAll()

    const channel = supabase
      .channel("timeline:" + bookingId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_events",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => { fetchAll() }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [bookingId, supabase])

  if (events === null) {
    return <p className="text-xs text-muted">Loading timeline…</p>
  }
  if (events.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-muted">No activity yet.</p>
      </div>
    )
  }

  const latestId = events[events.length - 1]?.id

  return (
    <ol className="relative" style={{ listStyle: "none", paddingLeft: 0 }}>
      {events.map((ev, idx) => {
        const meta = STATUS_META[ev.to_status] || { label: ev.to_status, icon: "info" as IconName }
        const isCurrent = ev.id === latestId
        const isPast = ev.id !== latestId
        const isLast = idx === events.length - 1

        const isTerminalBad = ev.to_status === "cancelled" || ev.to_status === "disputed"
        const dotColor = isTerminalBad
          ? "var(--danger)"
          : isCurrent
          ? "var(--accent)"
          : "var(--success)"

        return (
          <li key={ev.id} className="relative flex gap-3.5" style={{ paddingBottom: isLast ? 0 : 20 }}>
            {!isLast && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 15,
                  top: 32,
                  bottom: 0,
                  width: 2,
                  background: isPast ? "var(--success)" : "var(--line-2, #2C2C2E)",
                  borderRadius: 2,
                  opacity: isPast ? 0.35 : 1,
                }}
              />
            )}

            <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
              {isCurrent && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    background: dotColor,
                    opacity: 0.2,
                    animation: "tl-pulse 1.8s ease-out infinite",
                  }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isTerminalBad
                    ? "color-mix(in srgb, var(--danger) 15%, transparent)"
                    : isCurrent
                    ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                    : "color-mix(in srgb, var(--success) 15%, transparent)",
                  border: "2px solid " + dotColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: dotColor,
                }}
              >
                <Icon name={meta.icon} className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p
                  className="text-sm font-medium text-ink leading-snug"
                  style={isCurrent ? { color: dotColor } : undefined}
                >
                  {meta.label}
                  {isCurrent && (
                    <span
                      className="ml-2 text-[10px] uppercase tracking-wider font-semibold"
                      style={{ color: dotColor }}
                    >
                      Now
                    </span>
                  )}
                </p>
                <span className="text-[11px] text-muted shrink-0" title={absTime(ev.created_at)}>
                  {relTime(ev.created_at)}
                </span>
              </div>

              <p className="text-xs text-muted mt-0.5">
                {actorLabel(ev.actor_id, ev.actor_role, actorNames)}
                {ev.from_status && ev.from_status !== ev.to_status && (
                  <span className="text-muted/70">
                    {" · "}
                    {ev.from_status.replace(/_/g, " ")}
                    {" → "}
                    {ev.to_status.replace(/_/g, " ")}
                  </span>
                )}
              </p>

              {ev.note && (
                <p
                  className="text-xs mt-2 italic leading-relaxed pl-3"
                  style={{
                    color: "var(--ink-2, #EBEBF5)",
                    borderLeft: "2px solid var(--line-2, #2C2C2E)",
                  }}
                >
                  {ev.note}
                </p>
              )}
            </div>
          </li>
        )
      })}

      <style>{`
        @keyframes tl-pulse {
          0%   { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </ol>
  )
}