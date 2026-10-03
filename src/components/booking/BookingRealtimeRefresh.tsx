"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Mount this on any page that needs to auto-refresh when the booking changes.
 * It subscribes to Realtime for this booking and calls router.refresh() —
 * which re-runs the server component, updating everything (status badge, prices,
 * estimates, quotes, timeline etc).
 */
export function BookingRealtimeRefresh({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const channel = supabase
      .channel("booking-refresh:" + bookingId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` },
        () => { if (!cancelled) router.refresh() }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_events", filter: `booking_id=eq.${bookingId}` },
        () => { if (!cancelled) router.refresh() }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotes", filter: `booking_id=eq.${bookingId}` },
        () => { if (!cancelled) router.refresh() }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estimates", filter: `booking_id=eq.${bookingId}` },
        () => { if (!cancelled) router.refresh() }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [bookingId, supabase, router])

  return null
}