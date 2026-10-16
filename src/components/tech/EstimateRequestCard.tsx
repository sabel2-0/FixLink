import { ChatButton } from "@/components/chat/ChatButton"
import { EstimateComposer } from "@/components/tech/EstimateComposer"
import { Icon, ApplianceIcon } from "@/lib/icons"
import { SERVICES, haversine } from "@/lib/booking/constants"

function fmtDate(d: string | null | undefined): string {
  if (!d) return ""
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
function fmtTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return t
  return (hour % 12 === 0 ? 12 : hour % 12) + ":" + m + " " + (hour >= 12 ? "PM" : "AM")
}
function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ""
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ""
  const diff = Math.max(0, Date.now() - t)
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return m + " min ago"
  const h = Math.floor(m / 60)
  if (h < 24) return h + "h ago"
  const d = Math.floor(h / 24)
  return d + "d ago"
}
function serviceIdForLabel(label: string): string | null {
  const t = label.trim().toLowerCase()
  const hit = SERVICES.find((s) => s.label.toLowerCase() === t)
  return hit ? hit.id : null
}
function displayAddress(addr: string | null | undefined, barangay: string | null | undefined): string {
  const raw = (addr && addr.trim()) || barangay || ""
  if (!raw) return ""
  const cleaned = raw.replace(/,\s*Philippines\s*$/i, "").trim()
  return cleaned.split(",").slice(0, 3).map((s) => s.trim()).join(", ")
}
function fmtKm(km: number): string {
  if (km < 1) return Math.round(km * 1000) + " m"
  if (km < 10) return km.toFixed(1) + " km"
  return Math.round(km) + " km"
}

export function EstimateRequestCard({
  bookingId,
  services,
  customerName,
  customerId,
  barangay,
  address,
  scheduledDate,
  scheduledTime,
  createdAt,
  problems,
  techLat,
  techLng,
  bookingLat,
  bookingLng,
  showChat,
}: {
  bookingId: string
  services: string
  customerName: string
  customerId?: string
  barangay: string | null
  address?: string | null
  scheduledDate: string | null
  scheduledTime: string | null
  createdAt?: string | null
  problems: string[]
  techLat?: number | null
  techLng?: number | null
  bookingLat?: number | null
  bookingLng?: number | null
  showChat?: boolean
}) {
  const firstService = services.split(" + ")[0]?.trim() || "Service"
  const iconId = serviceIdForLabel(firstService)

  const loc = displayAddress(address, barangay)

  let distanceKm: number | null = null
  if (
    techLat != null && techLng != null &&
    bookingLat != null && bookingLng != null
  ) {
    try {
      distanceKm = haversine(techLat, techLng, bookingLat, bookingLng)
    } catch { distanceKm = null }
  }

  const posted = relativeTime(createdAt)

  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-4 flex flex-col gap-3">

      {/* Row 1: icon + service / customer + posted time */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            color: "var(--accent)",
          }}
          aria-hidden
        >
          {iconId ? (
            <ApplianceIcon id={iconId} className="w-5 h-5" />
          ) : (
            <Icon name="wrench" className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">{services || "Service"}</p>
          <p className="text-xs text-muted mt-0.5 truncate">{customerName}</p>
        </div>

        {posted && (
          <span className="text-xs text-accent whitespace-nowrap shrink-0">{posted}</span>
        )}
      </div>

      {/* Row 2: location + distance */}
      {loc && (
        <div className="flex items-center gap-2 text-xs">
          <Icon name="pin" className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-muted truncate flex-1" title={(address || "").replace(/,\s*Philippines\s*$/i, "")}>
            {loc}
          </span>
          {distanceKm != null && (
            <span className="text-ink font-semibold whitespace-nowrap">
              {fmtKm(distanceKm)}
            </span>
          )}
        </div>
      )}

      {/* Row 3: scheduled date + time */}
      {(scheduledDate || scheduledTime) && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Icon name="clock" className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {fmtDate(scheduledDate)}
            {scheduledTime ? ", " + fmtTime(scheduledTime) : ""}
          </span>
        </div>
      )}

      {/* Row 4: problem bar */}
      {problems.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line bg-surface">
          <Icon name="alert" className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-xs text-ink/90 truncate">{problems.join(" / ")}</span>
        </div>
      )}

      {/* Row 5: actions */}
      <div className="flex items-stretch gap-2 w-full">
        {showChat && customerId && (
          <div className="shrink-0 flex items-stretch">
            <ChatButton
              bookingId={bookingId}
              partnerId={customerId}
              partnerName={customerName}
              partnerRole={services || "Service"}
              variant="icon"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <EstimateComposer
            bookingId={bookingId}
            service={services || "Service"}
            customer={customerName}
            barangay={barangay || "--"}
            problems={problems}
          />
        </div>
      </div>

    </div>
  )
}