"use client"

import { useMemo } from "react"

const DEFAULT_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]

function fmt(t: string): string {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return h12 + ":" + String(m).padStart(2, "0") + " " + ampm
}

export function TimeSlotPicker({
  value,
  onChange,
  slots = DEFAULT_SLOTS,
}: {
  value: string
  onChange: (v: string) => void
  slots?: string[]
}) {
  const { am, pm } = useMemo(() => {
    const sorted = [...slots].sort()
    return {
      am: sorted.filter((s) => parseInt(s.split(":")[0], 10) < 12),
      pm: sorted.filter((s) => parseInt(s.split(":")[0], 10) >= 12),
    }
  }, [slots])

  return (
    <div className="space-y-4">
      {am.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
            Morning
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {am.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                aria-pressed={value === s}
                className={"chip w-full justify-center " + (value === s ? "chip-active" : "")}
              >
                {fmt(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {pm.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
            Afternoon &amp; evening
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {pm.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                aria-pressed={value === s}
                className={"chip w-full justify-center " + (value === s ? "chip-active" : "")}
              >
                {fmt(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted leading-relaxed">
        Slots shown are typical working hours. Need a different time? Note it below and the
        technician will confirm.
      </p>
    </div>
  )
}