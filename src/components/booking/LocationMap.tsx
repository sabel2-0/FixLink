"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  lat: number | null
  lng: number | null
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

export function LocationMap({ lat, lng, height = 260 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!AWS_KEY) { setError("Map key is missing."); return }

    let cancelled = false
    ;(async () => {
      try {
        const maplibregl = await loadMapLibre()
        if (cancelled || !ref.current) return

        const start: [number, number] = lat != null && lng != null ? [lng, lat] : [123.9033, 10.3272]

        if (!mapRef.current) {
          mapRef.current = new maplibregl.Map({
            container: ref.current,
            style: STYLE_URL,
            center: start,
            zoom: 16,
            attributionControl: false,
            interactive: true,
          })
          mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

          const el = document.createElement("div")
          el.style.cssText = "width:26px;height:26px;border-radius:50%;background:#0A84FF;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);pointer-events:none;"
          markerRef.current = new maplibregl.Marker({ element: el, draggable: false })
            .setLngLat(start)
            .addTo(mapRef.current)

          mapRef.current.setMaxBounds([
            [start[0] - 0.05, start[1] - 0.05],
            [start[0] + 0.05, start[1] + 0.05],
          ])

          mapRef.current.on("load", () => setReady(true))
        } else {
          mapRef.current.setCenter(start)
          markerRef.current?.setLngLat(start)
          mapRef.current.setMaxBounds([
            [start[0] - 0.05, start[1] - 0.05],
            [start[0] + 0.05, start[1] + 0.05],
          ])
        }
      } catch (err) {
        console.error("Failed to load maplibre:", err)
        if (!cancelled) setError("Couldn't load map.")
      }
    })()
    return () => { cancelled = true }
  }, [lat, lng])

  useEffect(() => {
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }} />
      {!ready && !error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
          Loading map...
        </div>
      )}
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  )
}
