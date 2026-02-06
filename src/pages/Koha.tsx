import { Book, Search, Users, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoIBIME from '@/assets/logo-ibime.png';

const features = [
  {
    icon: Search,
    title: 'Catálogo en Línea',
    description: 'Busca y explora nuestra colección de libros, revistas y materiales multimedia desde cualquier lugar.',
  },
  {
    icon: Book,
    title: 'Préstamos Digitales',
    description: 'Gestiona tus préstamos, renovaciones y reservas de manera sencilla y rápida.',
  },
  {
    icon: Users,
    title: 'Cuenta de Usuario',
    description: 'Accede a tu historial de préstamos, lista de favoritos y recomendaciones personalizadas.',
  },
  {
    icon: Clock,
    title: 'Disponibilidad en Tiempo Real',
    description: 'Consulta la disponibilidad de materiales en todas las bibliotecas de la red IBIME.',
  },
];

export const Koha = () => {
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
            Sistema de Gestión Bibliotecaria
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            KOHA
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
            Sistema integrado de gestión bibliotecaria de código abierto que facilita el acceso 
            a nuestros recursos bibliográficos y servicios de préstamo.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Acceder al Catálogo
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Funcionalidades del <span className="text-gradient">Sistema</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre todo lo que puedes hacer con nuestro catálogo en línea.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-institutional text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-institutional flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={logoIBIME} 
            alt="IBIME" 
            className="h-20 w-auto object-contain mx-auto mb-6"
          />
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            ¿Listo para explorar nuestra colección?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Accede al catálogo KOHA y descubre miles de recursos bibliográficos a tu disposición.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-hero">
              Ir al Catálogo KOHA
            </Button>
            <Link to="/#contacto">
              <Button size="lg" variant="outline">
                Contactar Soporte
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

export default Koha;
