import { z } from 'zod';

/**
 * Zod schemas for form/input validation. These validate user input at the
 * service boundary; domain TYPES live in @loquia/domain.
 */

export const localeSchema = z.enum([
  'pt-BR',
  'en-US',
  'es-ES',
  'es-MX',
  'fr-FR',
  'de-DE',
]);

export const requestAccessSchema = z.object({
  name: z.string().min(2, 'validation.name_min'),
  email: z.string().email('validation.email_invalid'),
  company: z.string().min(2, 'validation.company_min'),
  role: z.string().min(2, 'validation.role_min'),
  useCase: z.string().min(10, 'validation.use_case_min').max(1000),
  preferredLocale: localeSchema,
});
export type RequestAccessInput = z.infer<typeof requestAccessSchema>;

export const loginSchema = z.object({
  email: z.string().email('validation.email_invalid'),
  password: z.string().min(1, 'validation.password_required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('validation.email_invalid'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, 'validation.password_min'),
    confirmPassword: z.string().min(8, 'validation.password_min'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.password_mismatch',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const activateAccountSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().min(2, 'validation.name_min'),
    password: z.string().min(8, 'validation.password_min'),
    confirmPassword: z.string().min(8, 'validation.password_min'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.password_mismatch',
    path: ['confirmPassword'],
  });
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;

export const rejectAccessSchema = z.object({
  reason: z.string().min(3, 'validation.reason_min'),
});
export type RejectAccessInput = z.infer<typeof rejectAccessSchema>;

export const inviteUserSchema = z.object({
  email: z.string().email('validation.email_invalid'),
  role: z.enum(['owner', 'admin', 'member']),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

// Admin creates a user directly with a provisional password (the user changes
// it later via the invite link or "forgot password"). Password is optional —
// when omitted the API generates a strong provisional one and echoes it once.
export const createUserSchema = z.object({
  email: z.string().email('validation.email_invalid'),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(['admin', 'member']).default('member'),
  password: z.string().min(8, 'validation.password_min').max(200).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
