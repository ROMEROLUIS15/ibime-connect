import { useState, type JSX } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { registerForEvent } from '@/services';
import { createCourseRegistrationSchema } from '@shared/validators/schemas';
import type { Event } from '@shared/types/domain';

interface RegistrationModalProps {
  readonly event: Event;
  readonly onClose: () => void;
}

interface RegistrationFormState {
  name: string;
  email: string;
  phone: string;
}

export function RegistrationModal({ event, onClose }: RegistrationModalProps): JSX.Element {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<RegistrationFormState>({
    name: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const parseResult = createCourseRegistrationSchema.safeParse({
      ...formData,
      courseName: event.title,
    });

    if (!parseResult.success) {
      toast({
        title: 'Datos inválidos',
        description: parseResult.error.issues[0]?.message ?? 'Verifica los datos ingresados.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await registerForEvent(parseResult.data);
    setIsSubmitting(false);

    if (result.ok) {
      toast({
        title: '¡Inscripción exitosa!',
        description: `Te has inscrito en "${event.title}". Te contactaremos pronto.`,
      });
      onClose();
    } else {
      toast({
        title: 'Error al inscribirse',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-title"
    >
      <div
        className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar modal de inscripción"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="registration-title" className="text-xl font-display font-bold text-foreground mb-1">
          Inscripción
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {event.title} — {event.date}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1">
              Nombre Completo *
            </label>
            <Input
              id="reg-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="h-11 border-border focus:ring-ibime-green"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-1">
              Correo Electrónico *
            </label>
            <Input
              id="reg-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-11 border-border focus:ring-ibime-green"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-foreground mb-1">
              Teléfono *
            </label>
            <Input
              id="reg-phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Ej: 04121234567"
              className="h-11 border-border focus:ring-ibime-green"
              autoComplete="tel"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 btn-hero"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? 'Enviando...' : 'Confirmar Inscripción'}
          </Button>
        </form>
      </div>
    </div>
  );
}
