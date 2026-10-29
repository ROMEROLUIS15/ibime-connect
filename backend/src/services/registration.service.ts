import { supabaseClient } from '../config/supabase.config.js';
import { logger } from '../infrastructure/logger/index.js';
import { ConflictError, handleSupabaseError } from '../domain/errors/app-error.js';
import { maskEmail } from '../utils/pii.util.js';

/** Código de Postgres para la violación de una restricción UNIQUE. */
const UNIQUE_VIOLATION = '23505';

export const ALREADY_REGISTERED =
  'Ya estás inscrito en este curso. Si necesitas actualizar tus datos, llámanos al 0274-2623898.';

export interface CourseRegistration {
  name: string;
  email: string;
  phone: string;
  courseName: string;
}

export class RegistrationService {
  static async register(data: CourseRegistration, requestId?: string) {
    const log = requestId ? logger.child({ requestId }) : logger;

    // La constraint UNIQUE(email, course_name) impide inscribir dos veces el mismo
    // correo en un curso. Ese rechazo se informa a la persona ("ya estás inscrito"):
    // antes se ignoraba y se respondía "inscripción completada". El teléfono no es
    // único: una familia puede inscribir a varias personas con el mismo número.
    const { error } = await supabaseClient
      .from('course_registrations')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        course_name: data.courseName
      });

    if (error && (error as { code?: string }).code === UNIQUE_VIOLATION) {
      throw new ConflictError(ALREADY_REGISTERED);
    }

    if (error) {
      handleSupabaseError(
        log,
        error,
        { email: maskEmail(data.email), courseName: data.courseName },
        'registering for course'
      );
    }

    return { success: true };
  }

  static async findByEmail(email: string, requestId?: string) {
    const log = requestId ? logger.child({ requestId }) : logger;
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseClient
      .from('course_registrations')
      .select('course_name, name, phone, created_at')
      .eq('email', normalizedEmail);

    if (error) {
      handleSupabaseError(log, error, { email: maskEmail(email) }, 'finding registrations by email');
    }

    return data || [];
  }
}
