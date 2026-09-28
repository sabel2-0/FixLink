"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/AppToast"
import { Icon } from "@/lib/icons"

export default function ProfilePage() {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [referralCode, setReferralCode] = useState("")

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setEmail(user.email || "")
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single()
      if (profile) {
        setFullName(profile.full_name || "")
        setPhone(profile.phone || "")
      }
      // Referral code from initial letters + numeric suffix derived from uid
      const initials = (profile?.full_name || "F L").split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 3)
      const num = parseInt(user.id.replace(/-/g, "").slice(0, 6), 16) % 900 + 100
      setReferralCode(initials + num)
      setLoading(false)
    })()
  }, [supabase])

  async function save() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", user.id)
      if (error) throw error
      toast("Saved")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-md"><p className="text-muted">Loading…</p></div>

  return (
    <div className="max-w-md">
      <h1 className="text-3xl font-semibold mb-8 tracking-tight">Profile</h1>

      <div className="card p-6 mb-4">
        <div className="space-y-4">
          <div>
            <label className="input-label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input" value={email} disabled />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
          </div>
          <button type="button" className="btn-primary w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <p className="input-label">Referral code</p>
        <p className="text-xl font-semibold text-accent mb-2 tracking-tight">{referralCode}</p>
        <p className="text-xs text-muted mb-4">Share with a technician you know.</p>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => {
            navigator.clipboard.writeText(referralCode)
            toast("Copied")
          }}
        >
          <Icon name="check" className="w-4 h-4" />
          Copy code
        </button>
      </div>
    </div>
  )
}
