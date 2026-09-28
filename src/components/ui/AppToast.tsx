"use client"

import { createContext, useCallback, useContext, useState, ReactNode } from "react"

type Toast = { id: number; msg: string }
const ToastCtx = createContext<(msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const show = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setItems((p) => [...p, { id, msg }].slice(-3))
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] space-y-2">
        {items.map((t) => (
          <div key={t.id} className="toast-item">{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
