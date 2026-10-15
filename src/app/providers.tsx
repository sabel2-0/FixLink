"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ToastProvider } from "@/components/ui/AppToast"
import { SiteNameProvider } from "@/components/shared/SiteNameProvider"
import { DocumentTitleSync } from "@/components/shared/DocumentTitleSync"

export function Providers({ children, initialName }: { children: React.ReactNode; initialName?: string }) {
  const [qc] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } })
  )
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <SiteNameProvider initialName={initialName}>
          <DocumentTitleSync />
          {children}
        </SiteNameProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
