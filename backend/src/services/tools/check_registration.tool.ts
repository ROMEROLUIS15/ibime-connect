import type { ITool } from '../../domain/interfaces/index.js';
import { RegistrationService } from '../registration.service.js';
import { phonesMatch } from '../../utils/phone.util.js';

/**
 * CheckRegistrationTool — Consulta de inscripciones con verificación de propiedad.
 *
 * DISEÑO DE SEGURIDAD (auto-protegida):
 *   La tool NUNCA devuelve qué cursos tiene un correo sin antes verificar que el
 *   teléfono provisto coincide con el registrado para ese correo. Esto cierra la
 *   fuga de PII por enumeración: cualquier llamador (el orquestador determinista
 *   o un LLM-agente que invoque la tool) recibe el mismo trato.
 *
 *   Anti-enumeración: "correo no existe" y "teléfono no coincide" devuelven el
 *   MISMO status `not_verified`, sin revelar si el correo está registrado.
 *
 * Estados devueltos:
 *   - { status: 'needs_phone' }   → falta el teléfono; el llamador debe pedirlo.
 *   - { status: 'verified', ... } → teléfono coincide; incluye los cursos.
 *   - { status: 'not_verified' }  → correo inexistente O teléfono no coincide.
 *   - { error }                   → fallo técnico.
 */
export class CheckRegistrationTool implements ITool {
  name = 'consultar_inscripciones';
  description =
    'Verifica en cuáles cursos está inscrito un usuario. REGLA ESTRICTA DE PRIVACIDAD: ' +
    'requiere SIEMPRE el correo electrónico Y el teléfono con el que la persona se registró. ' +
    'Sin un teléfono que coincida con el registro NO se revela ninguna inscripción. ' +
    'Si falta el correo o el teléfono, pídeselos al usuario en lugar de ejecutar la herramienta.';

  parameters = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'El correo electrónico provisto por el usuario.',
      },
      phone: {
        type: 'string',
        description: 'El teléfono con el que el usuario se registró (prueba de propiedad).',
      },
    },
    required: ['email', 'phone'],
  };

  async execute(args: { email?: string; phone?: string }): Promise<any> {
    if (!args.email) {
      return { error: 'Falta proveer el email.' };
    }
    if (!args.phone || args.phone.trim() === '') {
      return { status: 'needs_phone' };
    }

    try {
      const normalizedEmail = args.email.trim().toLowerCase();
      const records = await RegistrationService.findByEmail(normalizedEmail);

      // Verificación de propiedad: algún registro del correo debe coincidir con el
      // teléfono provisto. "Sin registros" y "teléfono no coincide" colapsan en el
      // mismo resultado para no revelar la existencia del correo (anti-enumeración).
      const ownsRegistration = records.some((r: any) => phonesMatch(r.phone ?? '', args.phone!));

      if (!ownsRegistration) {
        return { status: 'not_verified' };
      }

      return {
        status: 'verified',
        cantidad_cursos: records.length,
        cursos: records.map((r: any) => r.course_name),
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
