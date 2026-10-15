"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function confirmTopup(topupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  const { error } = await supabase
    .from("credit_topups")
    .update({ status: "confirmed" })
    .eq("id", topupId)
    .eq("status", "pending")

  if (error) return { error: error.message }

  revalidatePath("/admin/topups")
  revalidatePath("/tech/wallet")
  return { ok: true }
}

export async function rejectTopup(topupId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  const trimmed = reason.trim() || "Not specified"
  const { error } = await supabase
    .from("credit_topups")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", topupId)
    .eq("status", "pending")

  if (error) return { error: error.message }

  revalidatePath("/admin/topups")
  revalidatePath("/tech/wallet")
  return { ok: true }
}

export async function manualAdjustBalance(technicianId: string, delta: number, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  const { data: tp } = await supabase
    .from("technician_profiles")
    .select("credits_balance")
    .eq("id", technicianId)
    .maybeSingle()

  if (!tp) return { error: "Technician not found" }

  const next = Number(tp.credits_balance || 0) + Number(delta)

  const { error } = await supabase
    .from("technician_profiles")
    .update({ credits_balance: next })
    .eq("id", technicianId)

  if (error) return { error: error.message }

  revalidatePath("/admin/topups")
  revalidatePath("/tech/wallet")
  return { ok: true, newBalance: next, note }
}
