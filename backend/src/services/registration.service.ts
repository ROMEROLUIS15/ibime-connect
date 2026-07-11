import { supabaseClient } from '../config/supabase.config.js';
import { contextLogger, logger } from '../infrastructure/logger/index.js';
import { handleSupabaseError } from '../domain/errors/app-error.js';

export interface CourseRegistration {
  name: string;
  email: string;
  phone: string;
  courseName: string;
}

export class RegistrationService {
  static async register(data: CourseRegistration, requestId?: string) {
    const log = requestId ? contextLogger(requestId) : logger;

    // upsert idempotente: si la persona ya está inscrita en ese curso (mismo
    // email + course_name), no crea un duplicado (ON CONFLICT DO NOTHING) y
    // devuelve éxito igualmente. Evita inflar `cantidad_cursos` con repetidos.
    // Requiere la constraint UNIQUE(email, course_name).
    const { error } = await supabaseClient
      .from('course_registrations')
      .upsert(
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          course_name: data.courseName
        },
        { onConflict: 'email,course_name', ignoreDuplicates: true }
      );

    if (error) {
      handleSupabaseError(log as any, error, data, 'registering for course');
    }

    return { success: true };
  }

  static async findByEmail(email: string, requestId?: string) {
    const log = requestId ? contextLogger(requestId) : logger;
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseClient
      .from('course_registrations')
      .select('course_name, name, phone, created_at')
      .eq('email', normalizedEmail);

    if (error) {
      handleSupabaseError(log as any, error, { email }, 'finding registrations by email');
    }

    return data || [];
  }
}
