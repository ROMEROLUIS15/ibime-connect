import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { Headphones, BookOpen, Accessibility, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  {
    icon: Headphones,
    title: 'Audio Profesional',
    description: 'Grabaciones de alta calidad narradas por profesionales comprometidos con la inclusión.',
  },
  {
    icon: BookOpen,
    title: 'Catálogo Variado',
    description: 'Amplia selección de obras literarias, educativas y culturales en formato de audio.',
  },
  {
    icon: Accessibility,
    title: 'Accesibilidad',
    description: 'Servicio diseñado para personas con discapacidad visual y dificultades de lectura.',
  },
  {
    icon: Heart,
    title: 'Servicio Gratuito',
    description: 'Todos nuestros audiolibros están disponibles de forma completamente gratuita.',
  },
];

const LibroHabladoPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium rounded-full bg-accent/20 text-accent border border-accent/30">
              Inclusión Cultural
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Libro <span className="text-accent">Hablado</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Programa de audiolibros del IBIME dedicado a hacer accesible la lectura 
              para personas con discapacidad visual y toda la comunidad merideña.
            </p>
            <Button className="btn-hero">
              Explorar Audiolibros
            </Button>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Beneficios del <span className="text-gradient">Programa</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="card-institutional text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                    <benefit.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="card-institutional text-center">
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                Sobre el Programa
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                El programa Libro Hablado del IBIME nació con la misión de garantizar el acceso 
                a la lectura y la cultura para todas las personas, sin importar sus capacidades 
                físicas. A través de grabaciones profesionales de obras literarias, educativas y 
                culturales, buscamos promover la inclusión y el derecho a la información.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nuestro catálogo incluye obras de autores venezolanos, literatura universal, 
                textos educativos y material de interés cultural, todos disponibles de forma 
                gratuita para la comunidad.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default LibroHabladoPage;
