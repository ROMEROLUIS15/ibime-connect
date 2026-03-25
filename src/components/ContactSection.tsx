/**
 * frontend/src/components/features/ContactSection.tsx
 *
 * REFACTORED — UI only.
 * All Supabase calls moved to contact.service.ts
 * Validation moved to shared/validators/schemas.ts (Zod)
 */

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { MapPin, Clock, Phone, Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitContactMessage } from '@/services';
import { createContactMessageSchema } from '@shared/validators/schemas';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactFormState {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

interface ContactInfoItem {
  readonly icon: typeof MapPin;
  readonly title: string;
  readonly content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTACT_INFO: readonly ContactInfoItem[] = [
  {
    icon: MapPin,
    title: 'Dirección',
    content:
      'Sector Glorias Patrias, Calle 1 Los Eucaliptos,\nentre Av. Gonzalo Picón y Tulio Febres',
  },
  {
    icon: Clock,
    title: 'Horario de Atención',
    content: 'De Lunes a Viernes\n8:00 a.m a 12:00 p.m\n1:00 p.m a 4:00 p.m',
  },
  {
    icon: Phone,
    title: 'Teléfono',
    content: '0274-2623898',
  },
  {
    icon: Mail,
    title: 'Correo Electrónico',
    content: 'ibimeinformatica@gmail.com',
  },
] as const;

const INITIAL_FORM_STATE: ContactFormState = {
  name: '',
  email: '',
  message: '',
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactSection(): JSX.Element {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ContactFormState, string>>>(
    {},
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (name in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side validation
    const parseResult = createContactMessageSchema.safeParse(formData);
    if (!parseResult.success) {
      const errors: Partial<Record<keyof ContactFormState, string>> = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ContactFormState | undefined;
        if (field !== undefined) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    const result = await submitContactMessage(parseResult.data);

    setIsSubmitting(false);

    if (result.ok) {
      toast({
        title: '¡Mensaje enviado!',
        description: 'Gracias por contactarnos. Te responderemos pronto.',
      });
      setFormData(INITIAL_FORM_STATE);
    } else {
      toast({
        title: 'Error al enviar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <section id="contacto" className="pt-24 md:pt-28 pb-16 md:pb-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <button
            type="button"
            className="inline-flex items-center px-6 py-2.5 mb-4 text-sm md:text-base font-semibold rounded-full bg-ibime-green text-white shadow-md hover:bg-ibime-green/90 hover:shadow-lg transition-colors transition-shadow"
          >
            Contáctanos
          </button>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-4">
            Estamos para <span className="text-gradient">Servirte</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg font-medium text-[#374151]">
            ¿Tienes alguna pregunta o sugerencia? No dudes en comunicarte con nosotros.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Contact Info */}
          <div className="space-y-6 flex flex-col justify-center h-full">
            {CONTACT_INFO.map((item, index) => (
              <div key={index} className="card-institutional flex gap-4 shadow-md hover:shadow-lg">
                <div className="w-16 h-16 rounded-xl bg-ibime-green flex items-center justify-center flex-shrink-0 shadow-md">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-[#374151] whitespace-pre-line">{item.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="card-institutional flex flex-col justify-center h-full">
            <h3 className="text-2xl font-display font-bold text-foreground mb-6">
              Envíanos un Mensaje
            </h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nombre Completo
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  aria-invalid={fieldErrors.name !== undefined}
                  className="h-12 bg-[#F8FAFC] border border-border/80 focus-visible:border-ibime-green focus-visible:ring-2 focus-visible:ring-ibime-green/70"
                />
                {fieldErrors.name !== undefined && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  aria-invalid={fieldErrors.email !== undefined}
                  className="h-12 bg-[#F8FAFC] border border-border/80 focus-visible:border-ibime-green focus-visible:ring-2 focus-visible:ring-ibime-green/70"
                />
                {fieldErrors.email !== undefined && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="¿En qué podemos ayudarte?"
                  required
                  rows={5}
                  aria-invalid={fieldErrors.message !== undefined}
                  className="bg-[#F8FAFC] border border-border/80 focus-visible:border-ibime-green focus-visible:ring-2 focus-visible:ring-ibime-green/70"
                />
                {fieldErrors.message !== undefined && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 inline-flex items-center justify-center rounded-full bg-ibime-green text-white font-semibold shadow-md hover:bg-ibime-green/90 hover:shadow-lg transform hover:-translate-y-0.5 transition-colors transition-transform"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-5 h-5 mr-2" aria-hidden="true" />
                )}
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
