/**
 * shared/validators/schemas.ts
 *
 * Zod schemas for all user inputs.
 * These are the single source of truth for validation — used in forms (frontend)
 * and in request body validation (future backend middleware).
 *
 * Pattern: schema → inferred type → never define types manually for inputs.
 */

import { z } from 'zod';

// ─── Contact ─────────────────────────────────────────────────────────────────

export const createContactMessageSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(255, 'El correo no puede superar 255 caracteres')
    .toLowerCase(),
  message: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'El mensaje no puede superar 2000 caracteres')
    .trim(),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;

// ─── Event Registration ───────────────────────────────────────────────────────

export const createCourseRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(255)
    .toLowerCase(),
  phone: z
    .string()
    .min(7, 'El número de teléfono es requerido')
    .regex(/^[\d\s\-+().a-zA-Z,]{7,40}$/, 'Número de teléfono inválido'), // Regex más flexible para evitar falsos positivos
  courseName: z
    .string()
    .min(1, 'El nombre del curso es requerido')
    .max(200),
});

export type CreateCourseRegistrationInput = z.infer<typeof createCourseRegistrationSchema>;

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatRequestSchema = z.object({
  userMessage: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(500, 'El mensaje no puede superar 500 caracteres')
    .trim(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(1000),
      }),
    )
    .max(20, 'Historial demasiado largo')
    .default([]),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

// ─── Knowledge seed ───────────────────────────────────────────────────────────

export const knowledgeEntrySchema = z.object({
  category: z.enum(['libro', 'evento', 'tramite', 'horario', 'curso', 'servicio', 'contacto']),
  title: z.string().min(1).max(255),
  content: z.string().min(10).max(10_000),
  keywords: z.array(z.string()).max(20).nullable().default(null),
  sourceUrl: z.string().url().nullable().default(null),
});

export type KnowledgeEntryInput = z.infer<typeof knowledgeEntrySchema>;
