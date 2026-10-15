import { AboutContent } from "./about-content"
import { createClient } from "@/lib/supabase/server"

const FALLBACK_NAME = "FixLink"

async function getSiteName(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("app_settings")
      .select("site_name")
      .eq("id", 1)
      .maybeSingle()
    return data?.site_name || FALLBACK_NAME
  } catch {
    return FALLBACK_NAME
  }
}

export async function generateMetadata() {
  const name = await getSiteName()
  return {
    title: `About — ${name}`,
    description: "Trusted appliance repair, built for the Philippines and made to scale.",
  }
}

export default function AboutPage() {
  return <AboutContent />
}