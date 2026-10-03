"use server"

import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import {
  certVerifiedEmail,
  certRejectedEmail,
  customerVerifiedEmail,
  customerRejectedEmail,
} from "@/lib/email-templates"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function notifyRegistrationDecision(
  userId: string,
  decision: "verified" | "rejected" | "pending",
  reason?: string
) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, role")
    .eq("id", userId)
    .single()

  if (!profile) return { ok: false, error: "profile_not_found" }

  const firstName = profile.first_name || "there"

  if (profile.role === "technician") {
    if (decision === "verified") {
      const t = certVerifiedEmail(firstName, APP_URL)
      const r = await sendEmail({ to: profile.email, subject: t.subject, html: t.html })
      return { ok: r.ok }
    }
    if (decision === "rejected") {
      const t = certRejectedEmail(firstName, reason || "", APP_URL)
      const r = await sendEmail({ to: profile.email, subject: t.subject, html: t.html })
      return { ok: r.ok }
    }
  }

  if (profile.role === "customer") {
    if (decision === "verified") {
      const t = customerVerifiedEmail(firstName, APP_URL)
      const r = await sendEmail({ to: profile.email, subject: t.subject, html: t.html })
      return { ok: r.ok }
    }
    if (decision === "rejected") {
      const t = customerRejectedEmail(firstName, reason || "", APP_URL)
      const r = await sendEmail({ to: profile.email, subject: t.subject, html: t.html })
      return { ok: r.ok }
    }
  }

  return { ok: true }
}