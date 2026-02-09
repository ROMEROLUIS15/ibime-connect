import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { BookText, Feather, Award, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const publications = [
  {
    title: 'Revista Cultural Merideña',
    description: 'Publicación trimestral con artículos sobre cultura, historia y patrimonio del estado Mérida.',
    category: 'Revista',
  },
  {
    title: 'Colección Autores Merideños',
    description: 'Serie de publicaciones dedicada a difundir la obra de escritores y poetas del estado.',
    category: 'Colección',
  },
  {
    title: 'Cuadernos de Historia Regional',
    description: 'Investigaciones y ensayos sobre la historia del Estado Bolivariano de Mérida.',
    category: 'Investigación',
  },
  {
    title: 'Serie Infantil "Leer es Crecer"',
    description: 'Publicaciones ilustradas para fomentar la lectura en niños y niñas de la región.',
    category: 'Infantil',
  },
  {
    title: 'Memoria y Patrimonio',
    description: 'Documentos y catálogos sobre el patrimonio cultural e histórico merideño.',
    category: 'Patrimonio',
  },
  {
    title: 'Boletín Informativo IBIME',
    description: 'Publicación mensual con noticias, actividades y eventos del instituto.',
    category: 'Boletín',
  },
];

const features = [
  {
    icon: BookText,
    title: 'Publicaciones Propias',
    description: 'Editamos y publicamos obras de autores merideños y contenido cultural regional.',
  },
  {
    icon: Feather,
    title: 'Apoyo a Autores',
    description: 'Brindamos acompañamiento editorial a escritores emergentes del estado.',
  },
  {
    icon: Award,
    title: 'Calidad Editorial',
    description: 'Nuestras publicaciones cumplen con estándares profesionales de edición y diseño.',
  },
  {
    icon: Download,
    title: 'Acceso Digital',
    description: 'Muchas de nuestras publicaciones están disponibles en formato digital gratuito.',
  },
];

const FondoEditorialPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium rounded-full bg-accent/20 text-accent border border-accent/30">
              Publicaciones
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Fondo <span className="text-accent">Editorial</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              El Fondo Editorial del IBIME se dedica a la publicación y difusión de obras 
              literarias, culturales e históricas del Estado Bolivariano de Mérida.
            </p>
            <Button className="btn-hero">
              Ver Publicaciones
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Nuestro <span className="text-gradient">Trabajo Editorial</span>
              </h2>
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

        {/* Publications */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Nuestras <span className="text-gradient">Publicaciones</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.map((pub, index) => (
                <div key={index} className="card-institutional">
                  <span className="badge-institutional mb-3">{pub.category}</span>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">{pub.title}</h3>
                  <p className="text-muted-foreground">{pub.description}</p>
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

export default FondoEditorialPage;
