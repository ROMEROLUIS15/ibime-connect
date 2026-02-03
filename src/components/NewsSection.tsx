import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import libraryActivity from '@/assets/library-activity.jpg';
import communityEvent from '@/assets/community-event.jpg';

const news = [
  {
    id: 1,
    image: libraryActivity,
    date: '28 Enero 2026',
    category: 'Cultura',
    title: 'Nueva colección de libros de historia local',
    excerpt:
      'Más de 500 nuevos títulos sobre historia y patrimonio cultural se incorporan a nuestras bibliotecas metropolitanas.',
  },
  {
    id: 2,
    image: communityEvent,
    date: '25 Enero 2026',
    category: 'Educación',
    title: 'Talleres gratuitos de alfabetización digital',
    excerpt:
      'Inscripciones abiertas para los talleres de computación básica dirigidos a adultos mayores.',
  },
  {
    id: 3,
    image: libraryActivity,
    date: '20 Enero 2026',
    category: 'Comunidad',
    title: 'Programa de lectura para niños 2026',
    excerpt:
      'Inicia el programa anual de fomento a la lectura con actividades especiales para los más pequeños.',
  },
  {
    id: 4,
    image: communityEvent,
    date: '15 Enero 2026',
    category: 'Institucional',
    title: 'Ampliación de horarios en bibliotecas',
    excerpt:
      'A partir de febrero, las bibliotecas metropolitanas ampliarán su horario de atención al público.',
  },
];

export const NewsSection = () => {
  return (
    <section id="cartelera" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="badge-institutional mb-4">Actualidad</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
              Cartelera <span className="text-gradient">Informativa</span>
            </h2>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0 group">
            Ver todas las noticias
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {news.map((item, index) => (
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
