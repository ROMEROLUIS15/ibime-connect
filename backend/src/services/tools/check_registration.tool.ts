import type { ITool } from '../../domain/interfaces/index.js';
import { RegistrationService } from '../registration.service.js';

export class CheckRegistrationTool implements ITool {
  name = 'consultar_inscripciones';
  description = 'Consulta la base de datos para verificar en cuáles cursos está inscrito un usuario. REGLA ESTRICTA: NUNCA EJECUTES ESTA HERRAMIENTA SI NO TIENES EL CORREO ELECTRÓNICO REAL DEL USUARIO. Si no tienes el correo, no uses esta herramienta, mejor respondele pidiendo su correo.';
  
  parameters = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'El correo electrónico provisto por el usuario.'
      }
    },
    required: ['email']
  };

  async execute(args: { email?: string }): Promise<any> {
    if (!args.email) {
      return { error: 'Falta proveer el email.' };
    }
    
    try {
      const normalizedEmail = args.email.trim().toLowerCase();
      const records = await RegistrationService.findByEmail(normalizedEmail);
      if (records.length === 0) {
        return { status: 'no_registrado', mensaje: 'No se encontraron inscripciones para este correo.' };
      }
      return { status: 'registrado', cantidad_cursos: records.length, cursos: records.map((r: any) => r.course_name) };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
