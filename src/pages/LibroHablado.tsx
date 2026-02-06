import { Headphones, BookOpen, Volume2, Users, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoIBIME from '@/assets/logo-ibime.png';

const services = [
  {
    icon: Headphones,
    title: 'Audiolibros',
    description: 'Colección de libros narrados profesionalmente para personas con discapacidad visual.',
  },
  {
    icon: BookOpen,
    title: 'Material Adaptado',
    description: 'Textos en formato accesible, braille y macrotipo para diferentes necesidades.',
  },
  {
    icon: Volume2,
    title: 'Grabación Personalizada',
    description: 'Servicio de grabación de textos específicos según requerimientos del usuario.',
  },
  {
    icon: Users,
    title: 'Voluntariado',
    description: 'Únete a nuestro equipo de voluntarios lectores y narradores.',
  },
];

const benefits = [
  'Acceso gratuito para personas con discapacidad visual',
  'Catálogo diverso en literatura, educación y cultura',
  'Préstamo a domicilio disponible',
  'Asesoría personalizada en selección de materiales',
  'Equipos de reproducción especializados',
];

export const LibroHablado = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={logoIBIME} 
                alt="IBIME" 
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <Link to="/">
              <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-institutional text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-primary-foreground/20 rounded-full text-sm font-medium mb-6">
            Accesibilidad e Inclusión
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Libro Hablado
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
            Programa dedicado a brindar acceso a la lectura para personas con discapacidad visual, 
            promoviendo la inclusión a través de audiolibros y materiales adaptados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Headphones className="w-5 h-5 mr-2" />
              Explorar Audiolibros
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Heart className="w-5 h-5 mr-2" />
              Ser Voluntario
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Nuestros <span className="text-gradient">Servicios</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Facilitamos el acceso a la información y la cultura para todos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card-institutional text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-institutional flex items-center justify-center mx-auto mb-6">
                  <service.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-institutional mb-4">Beneficios</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                ¿Por qué elegir <span className="text-gradient">Libro Hablado</span>?
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-secondary-foreground text-sm font-bold">✓</span>
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-institutional text-center p-10 bg-gradient-institutional">
              <img 
                src={logoIBIME} 
                alt="IBIME" 
                className="h-24 w-auto object-contain mx-auto mb-6 brightness-0 invert"
              />
              <h3 className="text-2xl font-display font-bold text-primary-foreground mb-4">
                Comprometidos con la Inclusión
              </h3>
              <p className="text-primary-foreground/80">
                Creemos que el acceso a la información y la cultura es un derecho de todos. 
                Trabajamos para eliminar barreras y crear oportunidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            ¿Necesitas más información?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Contáctanos para conocer más sobre el programa Libro Hablado y cómo podemos ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/#contacto">
              <Button size="lg" className="btn-hero">
                Contactar
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline">
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={logoIBIME} 
            alt="IBIME" 
            className="h-12 w-auto object-contain mx-auto mb-4 brightness-0 invert"
          />
          <p className="text-primary-foreground/70 text-sm">
            © Copyright IBIME. Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LibroHablado;
