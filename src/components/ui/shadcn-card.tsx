import { HTMLAttributes } from "react"

export function Card({ children, className = "", bordered = false, ...props }: HTMLAttributes<HTMLDivElement> & { bordered?: boolean }) {
  return (
    <div className={`card ${bordered ? "card-bordered" : ""} ${className}`} {...props}>
      {children}
    </div>
  )
}
