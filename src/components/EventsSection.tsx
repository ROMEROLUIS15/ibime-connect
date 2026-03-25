/**
 * frontend/src/components/features/EventsSection.tsx
 *
 * REFACTORED — UI only.
 * Supabase call moved to events.service.ts
 * Modal form extracted to RegistrationModal sub-component
 * Typed with strict TS throughout
 */

import { useState, useEffect, type JSX } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { registerForEvent } from '@/services';
import { createCourseRegistrationSchema } from '@shared/validators/schemas';
import type { Event } from '@shared/types/domain';

import eventLiterary from '@/assets/event-literary.jpg';
import eventChildren from '@/assets/event-children.jpg';
import eventDigital from '@/assets/event-digital.jpg';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENTS: readonly Event[] = [
  {
    id: 1,
    image: eventLiterary,
    title: 'Festival del Libro 2026',
    date: '15-20 Febrero 2026',
    location: 'Biblioteca Central',
    description:
      'Una semana dedicada a la literatura con autores invitados, talleres de escritura y presentaciones de libros.',
  },
  {
    id: 2,
    image: eventChildren,
    title: 'Cuentacuentos Infantil',
    date: '8 Febrero 2026',
    location: 'Todas las bibliotecas',
    description:
      'Sesiones de narración oral para niños de 3 a 10 años con actividades interactivas y manualidades.',
  },
  {
    id: 3,
    image: eventDigital,
    title: 'Taller de Alfabetización Digital',
    date: '12 Febrero 2026',
    location: 'Biblioteca Norte',
    description: 'Aprende a usar computadoras, internet y herramientas digitales básicas. Cupos limitados.',
  },
  {
    id: 4,
    image: eventLiterary,
    title: 'Club de Lectura Mensual',
    date: '25 Febrero 2026',
    location: 'Biblioteca Sur',
    description: 'Discusión del libro del mes: "Cien años de soledad" de Gabriel García Márquez.',
  },
] as const;

const CAROUSEL_INTERVAL_MS = 5_000;

// ─── Registration Modal ───────────────────────────────────────────────────────

interface RegistrationModalProps {
  readonly event: Event;
  readonly onClose: () => void;
}

interface RegistrationFormState {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

const INITIAL_REGISTRATION_FORM: RegistrationFormState = {
  name: '',
  email: '',
  phone: '',
} as const;

function RegistrationModal({ event, onClose }: RegistrationModalProps): JSX.Element {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<RegistrationFormState>(INITIAL_REGISTRATION_FORM);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-title"
    >
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
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

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1">
              Nombre Completo *
            </label>
            <Input
              id="reg-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="h-11"
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
              className="h-11"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-foreground mb-1">
              Teléfono (opcional)
            </label>
            <Input
              id="reg-phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="h-11"
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function EventsSection(): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % EVENTS.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const prevSlide = (): void => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + EVENTS.length) % EVENTS.length);
  };

  const nextSlide = (): void => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % EVENTS.length);
  };

  const goToSlide = (index: number): void => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section id="eventos" className="py-20 bg-gradient-institutional text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block px-6 py-2.5 mb-4 text-sm md:text-base font-semibold rounded-full bg-white text-ibime-green shadow-sm">
            Agenda Cultural
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">
            Próximos Eventos
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              role="list"
              aria-label="Carrusel de eventos"
            >
              {EVENTS.map((event, idx) => (
                <div key={event.id} className="w-full flex-shrink-0" role="listitem">
                  <div className="grid md:grid-cols-2 gap-0 bg-card text-foreground rounded-2xl overflow-hidden shadow-institutional">
                    <div className="aspect-video md:aspect-auto">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        aria-hidden={idx !== currentIndex}
                      />
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold mb-4">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-ibime-green mb-2">
                        <Calendar className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <MapPin className="w-5 h-5" aria-hidden="true" />
                        <span>{event.location}</span>
                      </div>
                      <p className="text-foreground/80 leading-relaxed mb-6">{event.description}</p>
                      <button
                        className="self-start inline-flex items-center px-6 py-3 rounded-lg bg-ibime-green text-white font-semibold shadow-md hover:bg-ibime-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ibime-green transition-colors"
                        onClick={() => setSelectedEvent(event)}
                      >
                        Inscribirse
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            aria-label="Evento anterior"
            className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 md:-translate-x-16 lg:-translate-x-20 p-3 md:p-3.5 rounded-full bg-ibime-green text-white shadow-lg hover:bg-white hover:text-ibime-green transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Siguiente evento"
            className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 md:translate-x-16 lg:translate-x-20 p-3 md:p-3.5 rounded-full bg-ibime-green text-white shadow-lg hover:bg-white hover:text-ibime-green transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Eventos">
            {EVENTS.map((event, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Ir al evento: ${event.title}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white shadow-md'
                    : 'w-2.5 bg-primary-foreground/40 hover:bg-primary-foreground/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedEvent !== null && (
        <RegistrationModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </section>
  );
}

export default EventsSection;
