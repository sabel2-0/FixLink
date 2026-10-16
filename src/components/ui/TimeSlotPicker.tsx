"use client"

const HOURS = [
  "07", "08", "09", "10", "11",
  "13", "14", "15", "16", "17", "18", "19",
]
const MINUTES = ["00", "15", "30", "45"]

function fmtHour(h: string): string {
  const n = parseInt(h, 10)
  const ampm = n >= 12 ? "PM" : "AM"
  const h12 = n % 12 === 0 ? 12 : n % 12
  return h12 + " " + ampm
}

function fmtSelected(v: string): string {
  if (!v || v.length < 5) return ""
  const [h, m] = v.split(":")
  return fmtHour(h) + ":" + m
}

export function TimeSlotPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const parts = value && value.includes(":") ? value.split(":") : ["", ""]
  const selHour = parts[0]
  const selMin = parts[1]

  const am = HOURS.filter((h) => parseInt(h, 10) < 12)
  const pm = HOURS.filter((h) => parseInt(h, 10) >= 12)

  function pickHour(h: string) {
    onChange(h + ":" + (selMin || "00"))
  }
  function pickMinute(m: string) {
    if (!selHour) return
    onChange(selHour + ":" + m)
  }

  const groups = [
    { label: "Morning", list: am },
    { label: "Afternoon & evening", list: pm },
  ]

  return (
    <div className="space-y-4">
      {groups.map((g) =>
        g.list.length === 0 ? null : (
          <div key={g.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
              {g.label}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {g.list.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => pickHour(h)}
                  aria-pressed={selHour === h}
                  className={"chip w-full justify-center " + (selHour === h ? "chip-active" : "")}
                >
                  {fmtHour(h)}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {selHour && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
            Minutes
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => pickMinute(m)}
                aria-pressed={selMin === m}
                className={"chip w-full justify-center " + (selMin === m ? "chip-active" : "")}
              >
                :{m}
              </button>
            ))}
          </div>
        </div>
      )}

      {value && (
        <div className="rounded-lg bg-surface-2 px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted">Selected time</span>
          <span className="text-sm font-semibold text-ink">{fmtSelected(value)}</span>
        </div>
      )}

      <p className="text-[11px] text-muted leading-relaxed">
        Pick an hour, then fine-tune the minutes. Need a specific time not shown? Note it below
        and the technician will confirm.
      </p>
    </div>
  )
}