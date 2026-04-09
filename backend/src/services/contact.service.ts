import { supabaseClient } from '../config/supabase.config.js';

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export class ContactService {
  static async createMessage(data: ContactMessage) {
    const { error } = await supabaseClient
      .from('contact_messages')
      .insert({
        name: data.name,
        email: data.email,
        message: data.message
      });

    if (error) {
      console.error('[ContactService] Error inserting into Supabase:', {
        error,
        data: {
          name: data.name,
          email: data.email,
          message: data.message
        }
      });
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true };
  }
}
