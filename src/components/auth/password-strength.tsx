"use client"

export type Strength = {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
  suggestions: string[]
}

export function evaluatePassword(pw: string): Strength {
  if (!pw) {
    return { score: 0, label: "", color: "var(--line-2)", suggestions: [] }
  }

  const suggestions: string[] = []
  let score = 0

  if (pw.length >= 8) score++
  else suggestions.push("At least 8 characters")

  if (pw.length >= 12) score++
  else if (pw.length >= 8) suggestions.push("12+ chars is stronger")

  const hasLower = /[a-z]/.test(pw)
  const hasUpper = /[A-Z]/.test(pw)
  const hasNumber = /\d/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)

  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
  if (variety >= 2) score++
  else suggestions.push("Mix letters with numbers or symbols")
  if (variety >= 3) score++

  if (!hasUpper) suggestions.push("Add an uppercase letter")
  if (!hasNumber) suggestions.push("Add a number")
  if (!hasSymbol) suggestions.push("Add a symbol (!@#$)")

  // Common weak patterns → cap the score
  const common = ["password", "12345678", "qwerty", "letmein", "admin", "welcome", "iloveyou"]
  if (common.some((c) => pw.toLowerCase().includes(c))) {
    score = 1
  }

  // Repeating / sequential patterns → cap at 2
  if (/(.)\1{3,}/.test(pw) || /(?:abcd|1234|qwer)/i.test(pw)) {
    score = Math.min(score, 2)
  }

  const finalScore = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4

  const meta: Record<number, { label: string; color: string }> = {
    0: { label: "", color: "var(--line-2)" },
    1: { label: "Weak", color: "var(--danger)" },
    2: { label: "Fair", color: "var(--warn)" },
    3: { label: "Good", color: "#3B82F6" },
    4: { label: "Strong", color: "var(--success)" },
  }

  return {
    score: finalScore,
    label: meta[finalScore].label,
    color: meta[finalScore].color,
    suggestions: finalScore >= 4 ? [] : suggestions.slice(0, 2),
  }
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, color, suggestions } = evaluatePassword(password)
  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: n <= score ? color : "var(--line-2)",
              }}
            />
          ))}
        </div>
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
            {label}
          </span>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="text-[11px] text-muted space-y-0.5">
          {suggestions.map((s) => <li key={s}>· {s}</li>)}
        </ul>
      )}
    </div>
  )
}