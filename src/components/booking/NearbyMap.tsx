"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type MLMap = any
type MLMarker = any
type MLPopup = any

declare global {
  interface Window { maplibregl?: any }
}

function loadMapLibre(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"))
    if (window.maplibregl) return resolve(window.maplibregl)

    const done = () => resolve(window.maplibregl)

    const cssId = "maplibre-css-cdn"
    let cssReady: Promise<void>
    if (document.getElementById(cssId)) {
      cssReady = Promise.resolve()
    } else {
      cssReady = new Promise((res) => {
        const link = document.createElement("link")
        link.id = cssId
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
        link.onload = () => res()
        link.onerror = () => res()
        document.head.appendChild(link)
      })
    }

    const scriptId = "maplibre-js-cdn"
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener("load", () => cssReady.then(done))
      existing.addEventListener("error", reject)
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"
    script.onload = () => { cssReady.then(done) }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

type TechPin = {
  id: string
  lat: number
  lng: number
  name: string
  isSelected: boolean
  rating?: number
  jobs?: number
  distanceKm?: number
  services?: string[]
  certified?: boolean
}

type Props = {
  meLat: number | null
  meLng: number | null
  techs: TechPin[]
  height?: number | string
  onToggle?: (id: string) => void
  focusId?: string | null
  hideLegend?: boolean
}

const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || "ap-southeast-1"
const AWS_KEY = process.env.NEXT_PUBLIC_AWS_MAP_KEY || ""
const AWS_STYLE = "Standard"
const AWS_COLOR = "Light"
const STYLE_URL =
  "https://maps.geo." + AWS_REGION + ".amazonaws.com/v2/styles/" + AWS_STYLE +
  "/descriptor?key=" + encodeURIComponent(AWS_KEY) + "&color-scheme=" + AWS_COLOR

const FIXED_ZOOM = 13
const DEFAULT_CENTER: [number, number] = [123.9033, 10.3272]

const GLOBAL_CSS = `
@keyframes pulseHalo {
  0%   { transform: translate(-50%,-50%) scale(1);   opacity: .45; }
  100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
}
.nearby-popup .maplibregl-popup-content {
  background: #1C1C1E;
  color: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 6px 24px rgba(0,0,0,.35);
}
.nearby-popup .maplibregl-popup-close-button { color: #C7C7CC; font-size: 18px; padding: 2px 8px; }
.nearby-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip,
.nearby-popup.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip,
.nearby-popup.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip { border-top-color: #1C1C1E; }
.nearby-popup.maplibregl-popup-anchor-top .maplibregl-popup-tip,
.nearby-popup.maplibregl-popup-anchor-top-left .maplibregl-popup-tip,
.nearby-popup.maplibregl-popup-anchor-top-right .maplibregl-popup-tip { border-bottom-color: #1C1C1E; }
.nearby-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: #1C1C1E; }
.nearby-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: #1C1C1E; }
`

function h(tag: string, style?: string, text?: string): HTMLElement {
  const node = document.createElement(tag)
  if (style) node.style.cssText = style
  if (text != null) node.textContent = text
  return node
}

function makeCircle(color: string, ring: string, size: number, label?: string, pulse?: boolean) {
  const wrap = h("div", "width:" + size + "px;height:" + size + "px;")
  const inner = h(
    "div",
    "position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;"
  )
  if (pulse) {
    inner.appendChild(
      h(
        "div",
        "position:absolute;left:50%;top:50%;width:100%;height:100%;border-radius:50%;background:" + color +
          ";opacity:.45;transform:translate(-50%,-50%);animation:pulseHalo 1.8s ease-out infinite;pointer-events:none;"
      )
    )
  }
  const dot = h(
    "div",
    "width:100%;height:100%;border-radius:50%;background:" + color +
      ";border:2.5px solid " + ring + ";box-sizing:border-box;position:relative;z-index:1;" +
      "display:flex;align-items:center;justify-content:center;" +
      "box-shadow:0 1px 4px rgba(0,0,0,.4);font-family:system-ui,-apple-system,sans-serif;"
  )
  if (label) {
    dot.style.color = "#fff"
    dot.style.fontSize = Math.max(9, size * 0.42) + "px"
    dot.style.fontWeight = "700"
    dot.textContent = label
  }
  inner.appendChild(dot)
  wrap.appendChild(inner)
  return wrap
}

function buildPopupContent(t: TechPin, onAction: () => void): HTMLElement {
  const hasRating = t.rating != null && t.rating > 0
  const rating = hasRating ? Math.min(5, Math.max(0, t.rating!)) : 0
  const rounded = Math.round(rating)
  const stars = hasRating ? "★".repeat(rounded) + "☆".repeat(5 - rounded) : ""
  const svc = t.services || []
  const services = svc.slice(0, 4).join(", ")
  const more = svc.length > 4 ? " +" + (svc.length - 4) : ""

  const root = h("div", "font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;min-width:220px;")

  const header = h("div", "display:flex;align-items:center;gap:8px;margin-bottom:8px;")
  header.appendChild(
    h(
      "div",
      "width:32px;height:32px;border-radius:50%;background:#0A84FF;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;",
      t.name.slice(0, 1).toUpperCase()
    )
  )
  const info = h("div", "flex:1;min-width:0;")
  const nameRow = h("div", "font-weight:600;font-size:14px;line-height:1.2;color:#fff;", t.name)
  if (t.certified) {
    nameRow.appendChild(h("span", "color:#30D158;font-size:11px;margin-left:6px;", "✓ verified"))
  }
  info.appendChild(nameRow)
  info.appendChild(h("div", "font-size:12px;color:#C7C7CC;margin-top:1px;", hasRating ? stars + " " + rating.toFixed(1) : "New technician · no reviews yet"))
  header.appendChild(info)
  root.appendChild(header)

  const jobsCount = t.jobs || 0; let stats = jobsCount + " completed " + (jobsCount === 1 ? "job" : "jobs")
  if (t.distanceKm != null) stats += " · " + t.distanceKm.toFixed(1) + " km away"
  root.appendChild(h("div", "font-size:12px;color:#AEAEB2;margin-bottom:6px;", stats))

  if (services) {
    root.appendChild(h("div", "font-size:12px;color:#EBEBF5;margin-bottom:10px;", "Covers: " + services + more))
  }

  const btn = h(
    "button",
    "width:100%;padding:8px 14px;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600;font-size:13px;color:#fff;background:" +
      (t.isSelected ? "#2C2C2E" : "#0A84FF") + ";",
    t.isSelected ? "Remove from request" : "Add to request"
  ) as HTMLButtonElement
  btn.type = "button"
  btn.onclick = (e) => {
    e.stopPropagation()
    onAction()
  }
  root.appendChild(btn)

  return root
}

export function NearbyMap({ meLat, meLng, techs, height = 360, onToggle, focusId, hideLegend = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MLMap | null>(null)
  const libRef = useRef<any>(null)
  const meMarkerRef = useRef<MLMarker | null>(null)
  const techMarkers = useRef<Record<string, { marker: MLMarker; popup: MLPopup; selected: boolean }>>({})
  const centeredOnMe = useRef(false)
  const readyRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onToggleRef = useRef(onToggle)
  onToggleRef.current = onToggle
  const techsRef = useRef(techs)
  techsRef.current = techs
  const meRef = useRef({ lat: meLat, lng: meLng })
  meRef.current = { lat: meLat, lng: meLng }

  useEffect(() => {
    if (!AWS_KEY) {
      setError("Map key is missing. Set NEXT_PUBLIC_AWS_MAP_KEY.")
      return
    }

    let cancelled = false
    let initializing = false
    const el = containerRef.current
    if (!el) return

    async function create() {
      if (mapRef.current || initializing) return
      const node = containerRef.current
      if (!node || node.clientWidth < 50 || node.clientHeight < 50) return

      initializing = true
      try {
        const maplibregl = await loadMapLibre()
        if (cancelled || !containerRef.current || mapRef.current) return

        const { lat, lng } = meRef.current
        const hasMe = lat != null && lng != null
        centeredOnMe.current = hasMe

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: STYLE_URL,
          center: hasMe ? [lng as number, lat as number] : DEFAULT_CENTER,
          zoom: FIXED_ZOOM,
          minZoom: FIXED_ZOOM - 2,
          maxZoom: FIXED_ZOOM + 3,
          attributionControl: false,
        })
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")

        map.on("load", () => {
          readyRef.current = true
          setReady(true)
        })
        map.on("error", (e: any) => {
          console.error("MAP ERROR:", e?.error?.message || e)
          if (!readyRef.current) setError("Couldn't load the map. Check your connection and try again.")
        })

        libRef.current = maplibregl
        mapRef.current = map
      } catch {
        if (!cancelled) setError("Couldn't load the map. Check your connection and try again.")
      } finally {
        initializing = false
      }
    }

    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize()
      else create()
    })
    ro.observe(el)
    create()

    return () => {
      cancelled = true
      ro.disconnect()
      Object.values(techMarkers.current).forEach((r) => r.marker.remove())
      techMarkers.current = {}
      meMarkerRef.current?.remove()
      meMarkerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      libRef.current = null
      centeredOnMe.current = false
      readyRef.current = false
      setReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!ready || !map || !lib || meLat == null || meLng == null) return

    if (!meMarkerRef.current) {
      meMarkerRef.current = new lib.Marker({ element: makeCircle("#0A84FF", "#ffffff", 20), anchor: "center" })
        .setLngLat([meLng, meLat])
        .addTo(map)
    } else {
      meMarkerRef.current.setLngLat([meLng, meLat])
    }

    if (!centeredOnMe.current) {
      centeredOnMe.current = true
      map.jumpTo({ center: [meLng, meLat] })
    }
  }, [ready, meLat, meLng])

  useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!ready || !map || !lib) return

    const seen: Record<string, boolean> = {}

    for (const t of techs) {
      if (t.lat == null || t.lng == null) continue
      seen[t.id] = true

      const existing = techMarkers.current[t.id]

      if (existing && existing.selected === t.isSelected) {
        existing.marker.setLngLat([t.lng, t.lat])
        existing.popup.setDOMContent(buildPopupContent(t, () => {
          onToggleRef.current?.(t.id)
          existing.popup.remove()
        }))
        continue
      }

      if (existing) existing.marker.remove()

      const color = t.isSelected ? "#0A84FF" : "#3A3A3C"
      const size = t.isSelected ? 30 : 24
      const el = makeCircle(color, "#ffffff", size, t.name.slice(0, 1).toUpperCase(), t.isSelected)
      el.style.cursor = "pointer"

      const popup = new lib.Popup({
        offset: 20,
        closeButton: true,
        maxWidth: "260px",
        className: "nearby-popup",
      })
      popup.setDOMContent(buildPopupContent(t, () => {
        onToggleRef.current?.(t.id)
        popup.remove()
      }))

      const marker = new lib.Marker({ element: el, anchor: "center" })
        .setLngLat([t.lng, t.lat])
        .setPopup(popup)
        .addTo(map)

      techMarkers.current[t.id] = { marker, popup, selected: t.isSelected }
    }

    for (const id of Object.keys(techMarkers.current)) {
      if (!seen[id]) {
        techMarkers.current[id].marker.remove()
        delete techMarkers.current[id]
      }
    }
  }, [ready, techs])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !focusId) return
    const t = techsRef.current.find((x) => x.id === focusId)
    if (!t) return
    map.easeTo({
      center: [t.lng, t.lat],
      duration: 700,
      easing: (p: number) => (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p),
    })
  }, [ready, focusId])

  function recenterToMe() {
    const map = mapRef.current
    if (!map) return
    const { lat, lng } = meRef.current
    if (lat == null || lng == null) return
    map.easeTo({
      center: [lng, lat],
      duration: 700,
      easing: (p: number) => (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p),
    })
  }

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <style>{GLOBAL_CSS}</style>

      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%", borderRadius: 12, overflow: "hidden", background: "#0e0e10" }}
      />

      {!hideLegend && (
        <div
          style={{
            position: "absolute", left: 12, bottom: 12, zIndex: 5,
            background: "rgba(28,28,30,.92)", color: "#fff",
            padding: "6px 10px", borderRadius: 8, fontSize: 11,
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0A84FF", border: "1.5px solid #fff", display: "inline-block" }} />
            You
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3A3A3C", border: "1.5px solid #fff", display: "inline-block" }} />
            Technician
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={recenterToMe}
        aria-label="Center on my location"
        style={{
          position: "absolute",
          right: 12,
          bottom: 56,
          zIndex: 6,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,.15)",
          background: "rgba(28,28,30,.92)",
          color: "#0A84FF",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,.4)",
          padding: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <circle cx="12" cy="12" r="8" opacity="0.4" />
        </svg>
      </button>

      {!ready && (
        <div
          role={error ? "alert" : "status"}
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, textAlign: "center",
            color: error ? "#FF453A" : "var(--muted, #8E8E93)", fontSize: 13,
          }}
        >
          {error ?? "Loading map…"}
        </div>
      )}
    </div>
  )
}