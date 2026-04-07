import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import libraryActivity from '@/assets/library-activity.jpg';
import communityEvent from '@/assets/community-event.jpg';

const news = [
  {
    id: 1,
    image: communityEvent,
    date: '14 Noviembre 2025',
    category: 'Institucional',
    title: 'Conformación del Congreso Nacional Constituyente Obrero',
    excerpt:
      'Cumpliendo con el llamado a la patria con la clase obrera, se llevó a cabo la convocatoria para la Conformación del Congreso Nacional Constituyente Obrero dentro del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, trabajadores y trabajadoras unidos participaron activamente y sin dilaciones en el proceso eleccionario de los Voceros y Voceras.',
    featured: true,
  },
  {
    id: 2,
    image: libraryActivity,
    date: '10 Noviembre 2025',
    category: 'Cultura',
    title: 'Nueva colección de libros de historia regional',
    excerpt:
      'Más de 300 nuevos títulos sobre historia y patrimonio cultural merideño se incorporan a nuestras bibliotecas.',
  },
  {
    id: 3,
    image: libraryActivity,
    date: '05 Noviembre 2025',
    category: 'Educación',
    title: 'Talleres gratuitos de alfabetización digital',
    excerpt:
      'Inscripciones abiertas para los talleres de computación básica dirigidos a adultos mayores.',
  },
  {
    id: 4,
    image: communityEvent,
    date: '01 Noviembre 2025',
    category: 'Comunidad',
    title: 'Programa de lectura para niños 2025',
    excerpt:
      'Inicia el programa anual de fomento a la lectura con actividades especiales para los más pequeños.',
  },
];

export const NewsSection = () => {
  const featuredNews = news.find(n => n.featured);
  const regularNews = news.filter(n => !n.featured);

  return (
    <section id="cartelera" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <span className="badge-institutional mb-4">Actualidad</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
              Cartelera <span className="text-gradient">Informativa</span>
            </h2>
          </div>
          <Button variant="outline" className="mt-6 md:mt-0 group whitespace-nowrap">
            Ver todas las noticias
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Featured News */}
        {featuredNews && (
          <article className="card-institutional mb-8 overflow-hidden p-0">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative overflow-hidden aspect-video md:aspect-auto">
                <img
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-4 py-2 text-sm font-medium rounded-full bg-ebime-red text-primary-foreground">
                  Destacado
                </span>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  {featuredNews.date}
                  <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs">
                    {featuredNews.category}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                  {featuredNews.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {featuredNews.excerpt}
                </p>
                <p className="text-sm text-muted-foreground italic mb-4">
                  Este es un llamado a la renovación profunda de nuestras estructuras, basado en las 7 grandes transformaciones impulsadas por nuestro Presidente Obrero Nicolás Maduro y el Gobernador Arnaldo Sánchez.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
                >
                  Leer más
                  <ArrowRight className="ml-1 w-4 h-4" />
                </a>
              </div>
            </div>
          </article>
        )}

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularNews.map((item, index) => (
            <article
              key={item.id}
              className="card-institutional group overflow-hidden p-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                  {item.category}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  {item.date}
                </div>
                <h3 className="font-display font-bold text-foreground mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {item.excerpt}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
                >
                  Leer más
                  <ArrowRight className="ml-1 w-4 h-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
