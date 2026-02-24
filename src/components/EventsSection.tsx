import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

const RegistrationModal = ({ event, onClose }: { event: typeof events[0]; onClose: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('course_registrations').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        course_name: event.title,
      });
      if (error) throw error;
      toast({
        title: '¡Inscripción exitosa!',
        description: `Te has inscrito en "${event.title}". Te contactaremos pronto.`,
      });
      onClose();
    } catch {
      toast({
        title: 'Error al inscribirse',
        description: 'Hubo un problema. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-display font-bold text-foreground mb-1">Inscripción</h3>
        <p className="text-sm text-muted-foreground mb-5">{event.title} — {event.date}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1">Nombre Completo *</label>
            <Input id="reg-name" name="name" value={formData.name} onChange={handleChange} required className="h-11" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-1">Correo Electrónico *</label>
            <Input id="reg-email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-11" />
          </div>
          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-foreground mb-1">Teléfono (opcional)</label>
            <Input id="reg-phone" name="phone" value={formData.phone} onChange={handleChange} className="h-11" />
          </div>
          <Button type="submit" className="w-full h-11 btn-hero" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {isSubmitting ? 'Enviando...' : 'Confirmar Inscripción'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export const EventsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);

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
        <div className="text-center mb-14 md:mb-16">
          <button
            type="button"
            className="inline-block px-6 py-2.5 mb-4 text-sm md:text-base font-semibold rounded-full bg-white text-ibime-green shadow-sm hover:bg-ibime-light-green hover:shadow-md transition-colors transition-shadow"
          >
            Agenda Cultural
          </button>
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
                  <div className="grid md:grid-cols-2 gap-0 bg-card text-foreground rounded-2xl overflow-hidden shadow-institutional">
                    <div className="aspect-video md:aspect-auto">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold mb-4">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-ibime-green mb-2">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <MapPin className="w-5 h-5" />
                        <span>{event.location}</span>
                      </div>
                      <p className="text-foreground/80 leading-relaxed mb-6">
                        {event.description}
                      </p>
                      <button
                        className="self-start inline-flex items-center px-6 py-3 rounded-lg bg-ibime-green text-white font-semibold shadow-md hover:bg-ibime-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ibime-green focus-visible:ring-offset-background transition-colors"
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

          {/* Navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-3 md:p-3.5 rounded-full bg-ibime-green text-white shadow-lg hover:bg-white hover:text-ibime-green transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-3 md:p-3.5 rounded-full bg-ibime-green text-white shadow-lg hover:bg-white hover:text-ibime-green transition-colors"
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
                    ? 'w-8 bg-white shadow-md'
                    : 'bg-primary-foreground/40 hover:bg-primary-foreground/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <RegistrationModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </section>
  );
};

export default EventsSection;
