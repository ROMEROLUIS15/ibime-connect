import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { Search, BookOpen, Users, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Search,
    title: 'Catálogo en Línea',
    description: 'Busca libros, revistas y recursos digitales disponibles en todas nuestras bibliotecas.',
  },
  {
    icon: BookOpen,
    title: 'Préstamos Digitales',
    description: 'Gestiona tus préstamos, renovaciones y reservas desde cualquier lugar.',
  },
  {
    icon: Users,
    title: 'Cuenta de Usuario',
    description: 'Crea tu cuenta para acceder a todos los servicios del sistema bibliotecario.',
  },
  {
    icon: Globe,
    title: 'Acceso Remoto',
    description: 'Consulta nuestro catálogo y recursos desde cualquier dispositivo con internet.',
  },
];

const KohaPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium rounded-full bg-accent/20 text-accent border border-accent/30">
              Sistema Bibliotecario
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Sistema <span className="text-accent">Koha</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Koha es nuestro sistema integrado de gestión bibliotecaria de código abierto, 
              que permite a los usuarios buscar, reservar y gestionar recursos bibliográficos.
            </p>
            <Button className="btn-hero" asChild>
              <a href="https://koha.ibime.gob.ve" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5 mr-2" />
                Acceder a Koha
              </a>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Funcionalidades del <span className="text-gradient">Sistema</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Koha ofrece herramientas completas para la gestión y consulta de nuestro acervo bibliográfico.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="card-institutional text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to use */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8 text-center">
              ¿Cómo usar <span className="text-gradient">Koha</span>?
            </h2>
            <div className="space-y-6">
              {['Ingresa al sistema Koha a través del enlace proporcionado.', 
                'Utiliza la barra de búsqueda para encontrar libros, revistas o recursos digitales.',
                'Crea tu cuenta de usuario para acceder a préstamos y reservas.',
                'Gestiona tus préstamos, renovaciones y multas desde tu perfil.'].map((step, i) => (
                <div key={i} className="card-institutional flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-institutional flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold">{i + 1}</span>
                  </div>
                  <p className="text-muted-foreground text-lg pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default KohaPage;
