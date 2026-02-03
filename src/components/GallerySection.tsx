import libraryBuilding from '@/assets/library-building.jpg';
import libraryActivity from '@/assets/library-activity.jpg';
import communityEvent from '@/assets/community-event.jpg';

const galleries = [
  {
    id: 1,
    image: libraryBuilding,
    title: 'Contactos',
    description: 'Encuentra la biblioteca más cercana',
    overlay: 'bg-ebime-blue/80',
  },
  {
    id: 2,
    image: libraryActivity,
    title: 'Espacios',
    description: 'Conoce nuestras instalaciones modernas',
    overlay: 'bg-ebime-purple/80',
  },
  {
    id: 3,
    image: communityEvent,
    title: 'Actividades',
    description: 'Participa en eventos culturales',
    overlay: 'bg-ebime-green/80',
  },
];

export const GallerySection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="badge-institutional mb-4">Explora</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Galería <span className="text-gradient">Destacada</span>
          </h2>
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {galleries.map((item, index) => (
            <a
              key={item.id}
              href="#"
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 ${item.overlay} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Default gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-2xl font-display font-bold text-primary-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-primary-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {item.description}
                </p>
              </div>

              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
