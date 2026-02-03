import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import eventLiterary from '@/assets/event-literary.jpg';
import eventChildren from '@/assets/event-children.jpg';
import eventDigital from '@/assets/event-digital.jpg';

const events = [
  {
    id: 1,
    image: eventLiterary,
    title: 'Festival del Libro 2026',
    date: '15-20 Febrero 2026',
    location: 'Biblioteca Central',
    description: 'Una semana dedicada a la literatura con autores invitados, talleres de escritura y presentaciones de libros.',
  },
  {
    id: 2,
    image: eventChildren,
    title: 'Cuentacuentos Infantil',
    date: '8 Febrero 2026',
    location: 'Todas las bibliotecas',
    description: 'Sesiones de narración oral para niños de 3 a 10 años con actividades interactivas y manualidades.',
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
];

export const EventsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev - 1 + events.length) % events.length);
  };

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev + 1) % events.length);
  };

  return (
    <section id="eventos" className="py-20 bg-gradient-institutional text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium rounded-full bg-accent/20 text-accent border border-accent/30">
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
            >
              {events.map(event => (
                <div key={event.id} className="w-full flex-shrink-0">
                  <div className="grid md:grid-cols-2 gap-0 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <div className="aspect-video md:aspect-auto">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-accent mb-2">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary-foreground/70 mb-4">
                        <MapPin className="w-5 h-5" />
                        <span>{event.location}</span>
                      </div>
                      <p className="text-primary-foreground/80 leading-relaxed mb-6">
                        {event.description}
                      </p>
                      <button className="btn-hero self-start">
                        Inscribirse
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-accent'
                    : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
