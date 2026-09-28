import { badgeClass } from "@/lib/format"

export function Badge({ status, className = "" }: { status: string; className?: string }) {
  return <span className={`badge ${badgeClass(status)} ${className}`}>{status}</span>
}
