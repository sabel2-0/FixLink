import { ButtonHTMLAttributes, forwardRef } from "react"

type Variant = "primary" | "secondary" | "ghost" | "link" | "danger"

const V: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  link: "btn-link",
  danger: "btn-danger",
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ variant = "primary", className = "", children, ...props }, ref) => (
    <button ref={ref} className={`${V[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
)
Button.displayName = "Button"
