import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name cannot be empty')
      .max(255, 'Name must be 255 characters or less')
      .optional(),
    email: z
      .string()
      .trim()
      .email('Email must be valid')
      .optional(),
    role: z
      .string()
      .trim()
      .min(1, 'Role cannot be empty')
      .max(50, 'Role must be 50 characters or less')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided'
  );
