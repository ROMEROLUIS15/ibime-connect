import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import heroBanner from '@/assets/hero-banner.jpg';
import libraryActivity from '@/assets/library-activity.jpg';
import communityEvent from '@/assets/community-event.jpg';

const slides = [
  {
    image: heroBanner,
    title: 'Bienvenidos a IBIME',
    subtitle: 'Instituto de Bibliotecas e Información',
    description: 'Educación, cultura y comunidad al servicio de todos los merideños',
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

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);

  return (
    <section id="inicio" className="relative h-screen min-h-[600px] overflow-hidden pt-16">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          
          {/* Content */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container mx-auto px-4">
              <div
                className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
                  index === currentSlide
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
              >
                <span className="inline-block px-4 py-2 mb-6 text-sm font-bold rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  {slide.subtitle}
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white font-medium mb-8 max-w-2xl mx-auto" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="#ibime"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-bold text-lg text-white bg-secondary hover:bg-secondary/80 hover:scale-105 transition-all duration-300"
                    style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
                  >
                    Conocer más
                  </a>
                  <a
                    href="#servicios"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-lg border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                  >
                    Nuestros Servicios
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/20 transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/20 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'w-10 bg-accent'
                : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-accent animate-pulse-soft" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
