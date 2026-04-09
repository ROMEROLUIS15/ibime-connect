/**
 * frontend/src/components/features/EventsSection.tsx
 *
 * REFACTORED — UI only.
 * Supabase call moved to events.service.ts
 * Modal form extracted to RegistrationModal sub-component
 * Typed with strict TS throughout
 */

import { useState, useEffect, type JSX } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import type { Event } from '@shared/types/domain';
import { RegistrationModal } from './RegistrationModal';

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



// ─── Main Component ───────────────────────────────────────────────────────────

export function EventsSection(): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!isAutoPlaying || selectedEvent !== null) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % EVENTS.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAutoPlaying, selectedEvent]);

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
