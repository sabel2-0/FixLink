import { ChatButton } from "@/components/chat/ChatButton"
import { EstimateComposer } from "@/components/tech/EstimateComposer"
import { Icon, ApplianceIcon } from "@/lib/icons"
import { SERVICES } from "@/lib/booking/constants"

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
function serviceIdForLabel(label: string): string | null {
  const t = label.trim().toLowerCase()
  const hit = SERVICES.find((s) => s.label.toLowerCase() === t)
  return hit ? hit.id : null
}

export function EstimateRequestCard({
  bookingId,
  services,
  customerName,
  customerId,
  barangay,
  scheduledDate,
  scheduledTime,
  problems,
  showChat,
}: {
  bookingId: string
  services: string
  customerName: string
  customerId?: string
  barangay: string | null
  scheduledDate: string | null
  scheduledTime: string | null
  problems: string[]
  showChat?: boolean
}) {
  const firstService = services.split(" + ")[0]?.trim() || "Service"
  const iconId = serviceIdForLabel(firstService)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-xl border border-line bg-surface-2/40 hover:bg-surface-2 transition-all">
      <div className="flex items-start gap-3 min-w-0 flex-1">
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

          <div className="flex items-center gap-1.5 text-xs text-muted mt-1 flex-wrap">
            <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[40ch]">{customerName}</span>
            {barangay && (
              <>
                <span className="opacity-40">{"\u00B7"}</span>
                <Icon name="pin" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[40ch]">{barangay}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
            <Icon name="clock" className="w-3.5 h-3.5 shrink-0" />
            <span>
              {fmtDate(scheduledDate)}
              {scheduledTime ? " " + "\u00B7" + " " + fmtTime(scheduledTime) : ""}
            </span>
          </div>

          {problems.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {problems.map((p, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-line bg-surface text-muted"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
        {showChat && customerId && (
          <ChatButton
            bookingId={bookingId}
            partnerId={customerId}
            partnerName={customerName}
            partnerRole={services || "Service"}
            variant="icon"
          />
        )}
        <EstimateComposer
          bookingId={bookingId}
          service={services || "Service"}
          customer={customerName}
          barangay={barangay || "--"}
          problems={problems}
        />
      </div>
    </div>
  )
}