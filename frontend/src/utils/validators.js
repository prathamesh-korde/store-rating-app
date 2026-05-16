import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(16, 'Password must not exceed 16 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*).');

const nameSchema = z
  .string()
  .min(20, 'Name must be at least 20 characters.')
  .max(60, 'Name must not exceed 60 characters.');

const emailSchema = z
  .string()
  .email('Please enter a valid email address.');

const addressSchema = z
  .string()
  .max(400, 'Address must not exceed 400 characters.')
  .optional()
  .or(z.literal(''));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  password: passwordSchema,
});

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  password: passwordSchema,
  role: z.enum(['admin', 'user', 'owner'], { required_error: 'Please select a role.' }),
  storeId: z.string().uuid().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const ratingSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export const createStoreSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  ownerId: z.string().uuid().optional(),
});
