import { supabaseClient } from '../config/supabase.config.js';
import { contextLogger, logger } from '../infrastructure/logger/index.js';
import { handleSupabaseError } from '../domain/errors/app-error.js';

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export class ContactService {
  static async createMessage(data: ContactMessage, requestId?: string) {
    const log = requestId ? contextLogger(requestId) : logger;

    const { error } = await supabaseClient
      .from('contact_messages')
      .insert({
        name: data.name,
        email: data.email,
        message: data.message
      });

    if (error) {
      handleSupabaseError(log as any, error, data, 'inserting contact message');
    }

    return { success: true };
  }
}
