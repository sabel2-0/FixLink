"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  bookingId: string
  meId: string
  otherId: string
  height?: number
}

const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    "esri-satellite": {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
    },
    "esri-labels": {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
    },
  },
  layers: [
    { id: "esri-satellite", type: "raster" as const, source: "esri-satellite" },
    { id: "esri-labels", type: "raster" as const, source: "esri-labels" },
  ],
}

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
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState("Waiting for location…")
  const [sharing, setSharing] = useState(false)

  // Map setup
  useEffect(() => {
    let cancelled = false
    let geoInterval: any = null
    let channel: any = null

    ;(async () => {
      const maplibregl = await loadMapLibre()
      if (cancelled || !ref.current) return

      if (!mapRef.current) {
        mapRef.current = new maplibregl.Map({
          container: ref.current,
          style: SATELLITE_STYLE as any,
          center: [123.9033, 10.3272],
          zoom: 13,
          attributionControl: false,
        })
        mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
      }
      setReady(true)

      // Pull both locations once
      async function pullLocations() {
        const { data } = await supabase
          .from("live_locations")
          .select("user_id, lat, lng, updated_at")
          .in("user_id", [meId, otherId])
        if (cancelled || !data) return
        for (const row of data) {
          plot(row.user_id, row.lat, row.lng)
        }
        drawLine()
      }

      function plot(userId: string, lat: number | null, lng: number | null) {
        if (lat == null || lng == null) return
        const isMe = userId === meId
        const el = document.createElement("div")
        el.style.cssText = "width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);" +
          "background:" + (isMe ? "#007AFF" : "#000") + ";color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;"

        const markerRef = isMe ? meMarker : otherMarker
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
        } else {
          markerRef.current = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current)
        }
      }

      function drawLine() {
        const a = meMarker.current?.getLngLat()
        const b = otherMarker.current?.getLngLat()
        if (!a || !b) return
        const coords = [[a.lng, a.lat], [b.lng, b.lat]]
        if (lineRef.current) {
          lineRef.current.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} })
        } else {
          mapRef.current.addSource("route", {
            type: "geojson",
            data: { type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} },
          })
          mapRef.current.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: { "line-color": "#007AFF", "line-width": 3, "line-dasharray": [2, 2] },
          })
          lineRef.current = mapRef.current.getSource("route")
        }
        const bounds = [[Math.min(a.lng, b.lng), Math.min(a.lat, b.lat)], [Math.max(a.lng, b.lng), Math.max(a.lat, b.lat)]]
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 16 })
        const R = 6371
        const toRad = (x: number) => (x * Math.PI) / 180
        const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
        const km = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
        setStatus(km.toFixed(1) + " km apart")
      }

      await pullLocations()

      channel = supabase
        .channel("live:" + bookingId)
        .on("postgres_changes", { event: "*", schema: "public", table: "live_locations" }, () => pullLocations())
        .subscribe()

      // Push my location every 10s while sharing
      geoInterval = setInterval(() => {
        if (!sharing) return
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
          () => {}
        )
      }, 10000)
    })()

    return () => {
      cancelled = true
      if (geoInterval) clearInterval(geoInterval)
      if (channel) supabase.removeChannel(channel)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      meMarker.current = null
      otherMarker.current = null
      lineRef.current = null
    }
  }, [bookingId, meId, otherId, supabase, sharing])

  async function toggleSharing() {
    const next = !sharing
    setSharing(next)
    if (next) {
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
        () => {}
      )
    } else {
      await supabase.from("live_locations").upsert({
        user_id: meId, sharing: false, updated_at: new Date().toISOString(),
      })
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }} />
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
          Loading live map…
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