const BREVO_URL = "https://api.brevo.com/v3/smtp/email"

type SendOpts = {
  to: string
  toName?: string
  subject: string
  html: string
}

export async function sendEmail({ to, toName, subject, html }: SendOpts) {
  const key = process.env.BREVO_API_KEY
  const sender = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || "FixLink"

  if (!key || !sender) {
    console.warn("[email] Brevo env vars missing — skipping send")
    return { ok: false, error: "missing_env" as const }
  }

  try {
    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": key,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: sender },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("[email] Brevo error:", res.status, text)
      return { ok: false, error: text }
    }

    const json = await res.json()
    return { ok: true, messageId: json.messageId as string }
  } catch (err) {
    console.error("[email] send failed:", err)
    return { ok: false, error: "network" as const }
  }
}