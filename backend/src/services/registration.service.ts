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

    const { error } = await supabaseClient
      .from('course_registrations')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        course_name: data.courseName
      });

    if (error) {
      handleSupabaseError(log as any, error, data, 'registering for course');
    }

    return { success: true };
  }

  static async findByEmail(email: string, requestId?: string) {
    const log = requestId ? contextLogger(requestId) : logger;

    const { data, error } = await supabaseClient
      .from('course_registrations')
      .select('course_name, name, created_at')
      .eq('email', email);

    if (error) {
      handleSupabaseError(log as any, error, { email }, 'finding registrations by email');
    }

    return data || [];
  }
}
