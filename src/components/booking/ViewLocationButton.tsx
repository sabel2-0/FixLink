"use client"

import { useState } from "react"
import { Icon } from "@/lib/icons"
import { LocationMap } from "@/components/booking/LocationMap"

type Props = {
  lat: number | null
  lng: number | null
  label?: string
  address?: string | null
}

function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null)
    const t = setTimeout(() => resolve(null), 6000)
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(t); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      () => { clearTimeout(t); resolve(null) },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    )
  })
}

export function ViewLocationButton({ lat, lng, label = "Customer location", address }: Props) {
  const [open, setOpen] = useState(false)
  const hasCoords = lat != null && lng != null

  async function openDirections() {
    const dest = (lat != null && lng != null) ? (lat + "," + lng) : (address || "")
    const origin = await getCurrentPosition()
    const url =
      "https://www.google.com/maps/dir/?api=1" +
      (origin ? "&origin=" + origin.lat + "," + origin.lng : "") +
      "&destination=" + encodeURIComponent(dest) + (address ? "&destination_place_id=" : "")
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <button
        type="button"
        disabled={!hasCoords}
        onClick={() => setOpen(true)}
        className="btn-secondary text-xs py-2 px-3"
        style={{ opacity: hasCoords ? 1 : 0.5, cursor: hasCoords ? "pointer" : "not-allowed" }}
      >
        <Icon name="map" className="w-3.5 h-3.5" />
        View on map
      </button>

      {open && hasCoords && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                {address && <p className="text-xs text-muted mt-0.5 truncate">{address}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn shrink-0"
                aria-label="Close"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3">
              <LocationMap lat={lat} lng={lng} height={360} />
            </div>

            <div className="p-3 border-t border-line flex gap-2">
              <button
                type="button"
                onClick={openDirections}
                className="btn-primary flex-1 !py-2.5 !text-sm"
              >
                Get directions
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1 !py-2.5 !text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
