const BASE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  line-height: 1.5;
  color: #111;
`
const CARD = "max-width:560px;margin:0 auto;padding:32px 24px;"
const BTN = "display:inline-block;background:#0A84FF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;margin-top:20px;"
const MUTED = "color:#666;font-size:13px;"
const HR = "border:none;border-top:1px solid #eee;margin:24px 0;"

// ---------- TECHNICIAN ----------
export function certVerifiedEmail(firstName: string, appUrl: string) {
  return {
    subject: "You're verified on FixLink — start taking jobs",
    html: `
      <div style="${BASE}">
        <div style="${CARD}">
          <h1 style="font-size:22px;margin:0 0 8px;color:#0A84FF">FixLink</h1>
          <p style="${MUTED};margin:0 0 24px">Technician verification</p>
          <h2 style="font-size:20px;margin:0 0 12px">You're verified, ${firstName}.</h2>
          <p>Your TESDA certificate and identity documents have been approved. You can now accept job requests from customers.</p>
          <a href="${appUrl}/tech" style="${BTN}">Open your dashboard</a>
          <hr style="${HR}" />
          <p style="${MUTED}">Questions? Reply to this email.</p>
          <p style="${MUTED};margin-top:16px">— The FixLink team</p>
        </div>
      </div>
    `,
  }
}

export function certRejectedEmail(firstName: string, reason: string, appUrl: string) {
  const safeReason = (reason || "Documents could not be verified").replace(/[<>]/g, "")
  return {
    subject: "Your FixLink technician application needs attention",
    html: `
      <div style="${BASE}">
        <div style="${CARD}">
          <h1 style="font-size:22px;margin:0 0 8px;color:#0A84FF">FixLink</h1>
          <p style="${MUTED};margin:0 0 24px">Technician verification</p>
          <h2 style="font-size:20px;margin:0 0 12px">Hi ${firstName},</h2>
          <p>We reviewed your technician application but couldn't verify it yet.</p>
          <div style="background:#FFF4E5;border-left:3px solid #FF9500;padding:14px 16px;border-radius:8px;margin:20px 0">
            <p style="margin:0;font-weight:600;font-size:13px;color:#8A5A00;text-transform:uppercase;letter-spacing:0.04em">Reason</p>
            <p style="margin:6px 0 0;color:#111">${safeReason}</p>
          </div>
          <p>You can fix the issue and resubmit your documents — we'll review again.</p>
          <a href="${appUrl}/registration-status" style="${BTN}">Review and resubmit</a>
          <hr style="${HR}" />
          <p style="${MUTED}">If you believe this was a mistake, reply to this email.</p>
          <p style="${MUTED};margin-top:16px">— The FixLink team</p>
        </div>
      </div>
    `,
  }
}

// ---------- CUSTOMER ----------
export function customerVerifiedEmail(firstName: string, appUrl: string) {
  return {
    subject: "Welcome to FixLink — your account is verified",
    html: `
      <div style="${BASE}">
        <div style="${CARD}">
          <h1 style="font-size:22px;margin:0 0 8px;color:#0A84FF">FixLink</h1>
          <p style="${MUTED};margin:0 0 24px">Account verification</p>
          <h2 style="font-size:20px;margin:0 0 12px">You're all set, ${firstName}.</h2>
          <p>Your identity documents have been verified. You can now book technicians, approve quotes, and track jobs in real time.</p>
          <a href="${appUrl}/app" style="${BTN}">Book a service</a>
          <hr style="${HR}" />
          <p style="${MUTED}">Need help? Reply to this email.</p>
          <p style="${MUTED};margin-top:16px">— The FixLink team</p>
        </div>
      </div>
    `,
  }
}

export function customerRejectedEmail(firstName: string, reason: string, appUrl: string) {
  const safeReason = (reason || "Documents could not be verified").replace(/[<>]/g, "")
  return {
    subject: "Your FixLink account needs attention",
    html: `
      <div style="${BASE}">
        <div style="${CARD}">
          <h1 style="font-size:22px;margin:0 0 8px;color:#0A84FF">FixLink</h1>
          <p style="${MUTED};margin:0 0 24px">Account verification</p>
          <h2 style="font-size:20px;margin:0 0 12px">Hi ${firstName},</h2>
          <p>We couldn't verify your FixLink account. See the reason below and resubmit.</p>
          <div style="background:#FFF4E5;border-left:3px solid #FF9500;padding:14px 16px;border-radius:8px;margin:20px 0">
            <p style="margin:0;font-weight:600;font-size:13px;color:#8A5A00;text-transform:uppercase;letter-spacing:0.04em">Reason</p>
            <p style="margin:6px 0 0;color:#111">${safeReason}</p>
          </div>
          <p>Upload clearer photos of your ID and selfie to try again.</p>
          <a href="${appUrl}/registration-status" style="${BTN}">Review and resubmit</a>
          <hr style="${HR}" />
          <p style="${MUTED}">If you believe this was a mistake, reply to this email.</p>
          <p style="${MUTED};margin-top:16px">— The FixLink team</p>
        </div>
      </div>
    `,
  }
}