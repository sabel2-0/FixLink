"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSiteName } from "@/components/shared/SiteNameProvider"

/** Updates the browser tab title when the admin renames the system. */
export function DocumentTitleSync() {
  const siteName = useSiteName()
  const pathname = usePathname()
  useEffect(() => {
    document.title = document.title.replace(/\bFixLink\b/g, siteName)
  }, [siteName, pathname])
  return null
}
