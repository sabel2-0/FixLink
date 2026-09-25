import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email(),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['customer', 'technician']),
  certNumber: z.string().optional(),
  certTrade: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'technician' && !data.certTrade) {
    ctx.addIssue({ code: 'custom', path: ['certTrade'], message: 'Specify your trade' })
  }
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Enter your password'),
})

export type LoginInput = z.infer<typeof loginSchema>
