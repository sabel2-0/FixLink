import { z } from "zod"

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name is too short").max(60),
  lastName:  z.string().min(2, "Last name is too short").max(60),
  email:     z.string().email("Enter a valid email"),
  phone:     z.string().min(7, "Enter a valid mobile number").max(20),
  password:  z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role:      z.enum(["customer", "technician"]).default("customer"),
  certNumber:      z.string().optional(),
  certTrade:       z.string().optional(),
  homeBarangay:    z.string().optional(),
  serviceAddress:  z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const loginSchema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>