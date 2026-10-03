"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  bookingId: string
  meId: string
  otherId: string
  height?: number
}

const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || "ap-southeast-1"
const AWS_KEY = process.env.NEXT_PUBLIC_AWS_MAP_KEY || ""
const AWS_STYLE = "Standard"
const AWS_COLOR = "Light"
const STYLE_URL =
  "https://maps.geo." + AWS_REGION + ".amazonaws.com/v2/styles/" + AWS_STYLE +
  "/descriptor?key=" + encodeURIComponent(AWS_KEY) + "&color-scheme=" + AWS_COLOR

declare global {
  interface Window { maplibregl?: any }
}

function loadMapLibre(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"))
    if (window.maplibregl) return resolve(window.maplibregl)

    const cssId = "maplibre-css-cdn"
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link")
      link.id = cssId
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
      document.head.appendChild(link)
    }

    const scriptId = "maplibre-js-cdn"
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve(window.maplibregl))
      existing.addEventListener("error", reject)
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"
    script.onload = () => resolve(window.maplibregl)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function LiveMap({ bookingId, meId, otherId, height = 320 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  const mapRef = useRef<any>(null)
  const meMarker = useRef<any>(null)
  const otherMarker = useRef<any>(null)
  const lineRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const geoIntervalRef = useRef<any>(null)

  // Use refs for values that shouldn't re-run the map effect
  const sharingRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState("Waiting for locationâ€¦")
  const [sharing, setSharingState] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  function setSharing(next: boolean) {
    sharingRef.current = next
    setSharingState(next)
  }

  // --- Map lifecycle (runs ONCE per booking/participants) ---
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const maplibregl = await loadMapLibre()
        if (cancelled || !ref.current) return

        if (!mapRef.current) {
          mapRef.current = new maplibregl.Map({
            container: ref.current,
            style: STYLE_URL,
            center: [123.9033, 10.3272],
            zoom: 13,
            attributionControl: false,
          })
          mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
        }

        function ensureMarker(isMe: boolean) {
          const markerRef = isMe ? meMarker : otherMarker
          if (markerRef.current) return markerRef.current
          const el = document.createElement("div")
          el.style.cssText =
            "width:32px;height:32px;border-radius:50%;border:3px solid #fff;" +
            "box-shadow:0 2px 8px rgba(0,0,0,.5);" +
            "background:" + (isMe ? "#0A84FF" : "#3A3A3C") + ";" +
            "color:#fff;display:flex;align-items:center;justify-content:center;" +
            "font-size:13px;font-weight:700;"
          el.textContent = isMe ? "You" : "Tech"
          markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([123.9033, 10.3272])
            .addTo(mapRef.current)
          return markerRef.current
        }

        function plot(userId: string, lat: number, lng: number) {
          const isMe = userId === meId
          const m = ensureMarker(isMe)
          m.setLngLat([lng, lat])
        }

        function drawLine() {
          const a = meMarker.current?.getLngLat()
          const b = otherMarker.current?.getLngLat()
          if (!a || !b) { setStatus("Waiting for locationâ€¦"); return }

          const coords = [[a.lng, a.lat], [b.lng, b.lat]]
          try {
            if (mapRef.current.getSource("route")) {
              mapRef.current.getSource("route").setData({
                type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {},
              })
            } else {
              mapRef.current.addSource("route", {
                type: "geojson",
                data: { type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} },
              })
              mapRef.current.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                paint: { "line-color": "#0A84FF", "line-width": 3, "line-dasharray": [2, 2] },
              })
            }
          } catch (e) {
            // style may still be loading; skip this frame
          }

          const bounds = [
            [Math.min(a.lng, b.lng), Math.min(a.lat, b.lat)],
            [Math.max(a.lng, b.lng), Math.max(a.lat, b.lat)],
          ]
          try { mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 16 }) } catch {}

          const R = 6371
          const toRad = (x: number) => (x * Math.PI) / 180
          const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
          const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
          const km = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
          setStatus(km.toFixed(1) + " km apart")
        }

        async function pullLocations() {
          if (cancelled) return
          const { data } = await supabase
            .from("live_locations")
            .select("user_id, lat, lng, updated_at, sharing")
            .in("user_id", [meId, otherId])

          if (!data) return

          for (const row of data) {
            if (row.lat != null && row.lng != null) plot(row.user_id, row.lat, row.lng)
            if (row.user_id === meId) {
              // Sync local sharing state with DB (first time only, so user toggle wins)
              if (sharingRef.current === false && row.sharing === true) {
                setSharing(true)
              }
            }
          }
          drawLine()
        }

        await pullLocations()
        setReady(true)

        // Realtime â€” refetch on any change
        channelRef.current = supabase
          .channel("live:" + bookingId + ":" + meId)
          .on("postgres_changes", { event: "*", schema: "public", table: "live_locations" }, () => {
            pullLocations()
          })
          .subscribe()
      } catch (e) {
        if (!cancelled) setLoadError("Couldn't load the map.")
      }
    })()

    return () => {
      cancelled = true
      if (geoIntervalRef.current) { clearInterval(geoIntervalRef.current); geoIntervalRef.current = null }
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      meMarker.current = null
      otherMarker.current = null
      lineRef.current = null
    }
  }, [bookingId, meId, otherId, supabase])

  // --- Sharing effect: pushes GPS while sharing is on ---
  useEffect(() => {
    if (!sharing) {
      if (geoIntervalRef.current) { clearInterval(geoIntervalRef.current); geoIntervalRef.current = null }
      return
    }

    async function pushOnce() {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await supabase.from("live_locations").upsert({
            user_id: meId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            sharing: true,
            updated_at: new Date().toISOString(),
          })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }

    pushOnce()
    geoIntervalRef.current = setInterval(pushOnce, 10000)
    return () => {
      if (geoIntervalRef.current) { clearInterval(geoIntervalRef.current); geoIntervalRef.current = null }
    }
  }, [sharing, meId, supabase])

  async function toggleSharing() {
    const next = !sharing
    setSharing(next)
    if (!next) {
      await supabase.from("live_locations").upsert({
        user_id: meId, sharing: false, updated_at: new Date().toISOString(),
      })
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }} />
      {!ready && !loadError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
          Loading live mapâ€¦
        </div>
      )}
      {loadError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", fontSize: 13 }}>
          {loadError}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 gap-3">
        <p className="text-xs text-muted">{status}</p>
        <button
          type="button"
          onClick={toggleSharing}
          className={sharing ? "btn-secondary text-xs py-2 px-3" : "btn-primary text-xs py-2 px-3"}
        >
          {sharing ? "Sharing on" : "Share location"}
        </button>
      </div>
    </div>
  )
}