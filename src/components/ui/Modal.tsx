"use client"

import { ReactNode, useEffect } from "react"
import { Icon } from "@/lib/icons"

export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; maxWidth?: string }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-surface rounded-t-2xl sm:rounded-2xl w-full ${maxWidth} max-h-[92vh] overflow-y-auto`}>
        {title && (
          <div className="p-4 border-b border-line flex items-center justify-between sticky top-0 bg-surface z-10">
            <p className="font-semibold text-sm">{title}</p>
            <button onClick={onClose} className="icon-btn"><Icon name="x" className="w-4 h-4" /></button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
