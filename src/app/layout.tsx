import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider } from "@/components/ThemeProvider"
import { createClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"] })

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

export async function generateMetadata(): Promise<Metadata> {
  const name = await getSiteName()
  return {
    title: `${name} - Trusted Appliance Repair`,
    description: "Verified technicians, live tracking, written quotes.",
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialName = await getSiteName()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Providers initialName={initialName}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}