import { ChatButton } from "@/components/chat/ChatButton"
import { EstimateComposer } from "@/components/tech/EstimateComposer"
import { Icon, ApplianceIcon } from "@/lib/icons"
import { SERVICES, haversine } from "@/lib/booking/constants"

function fmtDate(d: string | null | undefined): string {
  if (!d) return "--"
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
function fmtDistance(km: number): string {
  if (km < 1) return Math.round(km * 1000) + " m away"
  return km.toFixed(1) + " km away"
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
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-line bg-surface-2/40 hover:bg-surface-2 transition-all">
      <div className="flex items-start gap-3 min-w-0">
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

          <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
            <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{customerName}</span>
          </div>

          {loc && (
            <div className="flex items-start gap-1.5 text-xs text-muted mt-0.5">
              <Icon name="pin" className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
              <span className="truncate" title={(address || "").replace(/,\s*Philippines\s*$/i, "")}>
                {loc}
                {distanceKm != null && (
                  <span className="opacity-70"> {"\u00B7"} {fmtDistance(distanceKm)}</span>
                )}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5 flex-wrap">
            <Icon name="clock" className="w-3.5 h-3.5 shrink-0" />
            <span>
              {fmtDate(scheduledDate)}
              {scheduledTime ? " " + "\u00B7" + " " + fmtTime(scheduledTime) : ""}
            </span>
            {posted && (
              <>
                <span className="opacity-40">{"\u00B7"}</span>
                <span className="italic">posted {posted}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {problems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problems.map((p, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-full border border-line bg-surface text-ink/80"
            >
              {p}
            </span>
          ))}
        </div>
      )}

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