"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_NAME = "FixLink"

const SiteNameContext = createContext<string>(DEFAULT_NAME)

export function SiteNameProvider({ children, initialName }: { children: ReactNode; initialName?: string }) {
  const [name, setName] = useState<string>(initialName || DEFAULT_NAME)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from("app_settings")
        .select("site_name")
        .eq("id", 1)
        .maybeSingle()
      if (!cancelled && data?.site_name) setName((prev) => (prev === data.site_name ? prev : data.site_name!))
    }

    load()

    const ch = supabase
      .channel("site-name")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => load()
      )
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [supabase])

  return (
    <SiteNameContext.Provider value={name}>
      {children}
    </SiteNameContext.Provider>
  )
}

export function useSiteName() {
  return useContext(SiteNameContext)
}

/** Drop-in replacement for the literal string "FixLink" inside JSX. */
export function SiteName() {
  return <>{useSiteName()}</>
}
