import { BookOpen, FileText, Award, Download, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoIBIME from '@/assets/logo-ibime.png';

const categories = [
  {
    icon: BookOpen,
    title: 'Literatura Regional',
    description: 'Obras de autores merideños y venezolanos que reflejan nuestra identidad cultural.',
    count: '150+ títulos',
  },
  {
    icon: FileText,
    title: 'Investigación',
    description: 'Publicaciones académicas y estudios de interés para la comunidad científica.',
    count: '80+ títulos',
  },
  {
    icon: Award,
    title: 'Patrimonio Cultural',
    description: 'Documentos históricos y obras que preservan nuestra memoria colectiva.',
    count: '60+ títulos',
  },
  {
    icon: Download,
    title: 'Publicaciones Digitales',
    description: 'Acceso gratuito a nuestra colección de libros y revistas en formato digital.',
    count: '200+ títulos',
  },
];

const featuredBooks = [
  {
    title: 'Historia de Mérida',
    author: 'Varios Autores',
    year: '2023',
    category: 'Historia',
  },
  {
    title: 'Cuentos Andinos',
    author: 'Escritores Regionales',
    year: '2022',
    category: 'Literatura',
  },
  {
    title: 'Flora y Fauna de Los Andes',
    author: 'Instituto de Ciencias',
    year: '2023',
    category: 'Ciencias',
  },
  {
    title: 'Tradiciones Merideñas',
    author: 'Cronistas de la Ciudad',
    year: '2021',
    category: 'Cultura',
  },
];

export const FondoEditorial = () => {
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
            Publicaciones IBIME
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Fondo Editorial
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
            Preservamos y difundimos el patrimonio cultural, literario e histórico del Estado Bolivariano de Mérida 
            a través de nuestras publicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Ver Catálogo
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Download className="w-5 h-5 mr-2" />
              Descargas Gratuitas
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Nuestras <span className="text-gradient">Colecciones</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explora las diferentes categorías de nuestro fondo editorial.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="card-institutional text-center group hover:shadow-xl transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-institutional flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <category.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {category.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {category.description}
                </p>
                <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="badge-institutional mb-4">Destacados</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Publicaciones <span className="text-gradient">Recientes</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book, index) => (
              <div key={index} className="card-institutional">
                <div className="aspect-[3/4] bg-gradient-institutional rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-primary-foreground/50" />
                </div>
                <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded mb-2">
                  {book.category}
                </span>
                <h3 className="font-display font-bold text-foreground mb-1">
                  {book.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-1">{book.author}</p>
                <p className="text-muted-foreground/70 text-xs">{book.year}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              Ver Todas las Publicaciones
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="card-institutional text-center p-10 bg-gradient-institutional">
            <img 
              src={logoIBIME} 
              alt="IBIME" 
              className="h-20 w-auto object-contain mx-auto mb-6 brightness-0 invert"
            />
            <h2 className="text-2xl font-display font-bold text-primary-foreground mb-4">
              ¿Eres autor y quieres publicar con nosotros?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              El Fondo Editorial IBIME apoya a escritores locales. Conoce nuestros requisitos y proceso de publicación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/#contacto">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Enviar Propuesta
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Descargar Lineamientos
              </Button>
            </div>
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

export default FondoEditorial;
