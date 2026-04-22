import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import heroBanner from '@/assets/hero-banner.jpeg';
import libraryActivity from '@/assets/library-activity.jpg';
import communityEvent from '@/assets/community-event.jpg';

// Unified institutional accent from new color palette (Light Blue)
const IBIME_ACCENT = '#5AA5CC';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
  objectPosition?: string;
}

const slides: Slide[] = [
  {
    image: heroBanner,
    title: 'Bienvenidos a IBIME',
    subtitle: 'Instituto de Bibliotecas e Información',
    description: 'Educación, cultura y comunidad al servicio de todos los merideños',
    objectPosition: 'center 75%', // Foco en la parte inferior para mostrar el edificio y su base (muro de piedra)
  },
  {
    image: libraryActivity,
    title: 'Espacios de Conocimiento',
    subtitle: 'Bibliotecas Modernas',
    description: 'Accede a miles de recursos educativos y culturales en nuestras bibliotecas',
  },
  {
    image: communityEvent,
    title: 'Cultura para Todos',
    subtitle: 'Eventos Comunitarios',
    description: 'Participa en talleres, exposiciones y actividades culturales gratuitas',
  },
];

// Utilidad para smooth scroll
function smoothScrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000); // Aumentado de 6s a 10s
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  return (
    <section id="inicio" className="relative h-[85vh] min-h-[600px] overflow-hidden pt-16">
      {/* Slides */}
      {slides.map((slide, index) => {
        // Removemos la asimetría para que los botones nunca salten al cambiar de slide

        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background with bottom-up gradient overlay */}
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: slide.objectPosition || 'center center',
                }}
              />
              {/* Added a consistent dark overlay so text is legible against the bright white building */}
              <div className="absolute inset-0 pointer-events-none bg-black/40 mix-blend-multiply" />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Standardized content vertical alignment */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center h-full">
              <div
                className={[
                  'max-w-3xl w-full mx-auto flex flex-col items-center justify-center text-center transition-all duration-700',
                  index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
                ].join(' ')}
                style={{ minHeight: 0 }}
              >
                {/* Glassmorphic Top Badge */}
                <span
                  className="inline-block px-5 py-2 mb-8 rounded-full font-bold text-white border border-white/20 backdrop-blur-md bg-white/10"
                  style={{
                    textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                    fontWeight: 700,
                  }}
                >
                  {slide.subtitle}
                </span>

                {/* Main Headline */}
                <h1
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white mb-6"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.85)',
                  }}
                >
                  {slide.title}
                </h1>

                {/* Description / Secondary Phrase */}
                <p
                  className="text-lg md:text-xl font-semibold text-white mb-10 max-w-2xl mx-auto"
                  style={{
                    textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  }}
                >
                  {slide.description}
                </p>

                {/* Perfectly symmetrical CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mb-0">
                  {/* Primary CTA: IBIME Green, solid and bold */}
                  <button
                    type="button"
                    className="flex items-center justify-center h-14 min-w-[140px] px-8 rounded-lg font-bold text-lg text-white transition-all duration-200 opacity-100"
                    style={{
                      background: IBIME_ACCENT,
                      boxShadow: '0 8px 24px #5aa5cc44, 0 1.5px 8px #2224',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => smoothScrollToId('servicios')}
                  >
                    Conocer más
                  </button>
                  {/* Secondary CTA: outlined glassmorphic */}
                  <button
                    type="button"
                    className="flex items-center justify-center h-14 min-w-[140px] px-8 rounded-lg font-bold text-lg border-2 border-white text-white bg-white/10 backdrop-blur-md transition-all duration-200 hover:bg-white/20 focus:outline-none"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => smoothScrollToId('servicios')}
                  >
                    Nuestros Servicios
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/20 transition-all items-center justify-center"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/20 transition-all items-center justify-center"
        aria-label="Siguiente slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 md:bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a slide ${index + 1}`}
            className={`h-3 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? 'w-10'
                : 'w-3'
            }`}
            style={{
              border: 'none',
              outline: 'none',
              background: index === currentSlide ? IBIME_ACCENT : 'rgba(255,255,255,0.4)',
              boxShadow: index === currentSlide
                ? `${IBIME_ACCENT}66 0 1px 5px` // Soft shadow with brand accent
                : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
