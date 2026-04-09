import { supabaseClient } from '../config/supabase.config.js';

export interface CourseRegistration {
  name: string;
  email: string;
  phone: string;
  courseName: string;
}

export class RegistrationService {
  static async register(data: CourseRegistration) {
    const { error } = await supabaseClient
      .from('course_registrations')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        course_name: data.courseName
      });

    if (error) {
      console.error('[RegistrationService] Error inserting into Supabase:', {
        error,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          course_name: data.courseName
        }
      });
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true };
  }

  static async findByEmail(email: string) {
    const { data, error } = await supabaseClient
      .from('course_registrations')
      .select('course_name, name, created_at')
      .eq('email', email);

    if (error) {
      console.error('[RegistrationService] Error finding by email:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }
}
