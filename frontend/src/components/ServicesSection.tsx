import { MapPin, Library, BookOpen } from 'lucide-react';

const districts = [
  {
    id: 1,
    name: 'Distrito Norte',
    library: 'Biblioteca Metropolitana Norte',
    libraries: 8,
    readingPoints: 12,
    color: 'from-ebime-blue to-ebime-purple',
  },
  {
    id: 2,
    name: 'Distrito Sur',
    library: 'Biblioteca Metropolitana Sur',
    libraries: 6,
    readingPoints: 15,
    color: 'from-ebime-purple to-ebime-red',
  },
  {
    id: 3,
    name: 'Distrito Este',
    library: 'Biblioteca Metropolitana Este',
    libraries: 5,
    readingPoints: 8,
    color: 'from-ebime-red to-ebime-yellow',
  },
  {
    id: 4,
    name: 'Distrito Oeste',
    library: 'Biblioteca Metropolitana Oeste',
    libraries: 7,
    readingPoints: 10,
    color: 'from-ebime-yellow to-ebime-green',
  },
  {
    id: 5,
    name: 'Distrito Central',
    library: 'Biblioteca Metropolitana Central',
    libraries: 10,
    readingPoints: 20,
    color: 'from-ebime-green to-ebime-blue',
  },
  {
    id: 6,
    name: 'Distrito Periférico',
    library: 'Biblioteca Metropolitana Periférica',
    libraries: 4,
    readingPoints: 6,
    color: 'from-ebime-blue to-ebime-green',
  },
];

export const ServicesSection = () => {
  return (
    <section id="servicios" className="py-20 section-pattern">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-institutional mb-4">Red Bibliotecaria</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Servicios <span className="text-gradient">Bibliotecarios</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Nuestra red metropolitana de bibliotecas cubre todos los distritos de la ciudad, 
            acercando el conocimiento a cada rincón de la comunidad.
          </p>
        </div>

        {/* Districts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {districts.map((district, index) => (
            <div
              key={district.id}
              className="card-institutional group overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Map representation */}
              <div className={`h-40 rounded-xl bg-gradient-to-br ${district.color} mb-6 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <pattern id={`grid-${district.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
                    </pattern>
                    <rect width="100" height="100" fill={`url(#grid-${district.id})`} />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-primary-foreground opacity-80 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                {district.name}
              </h3>
              <p className="text-secondary font-medium mb-4">
                {district.library}
              </p>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Library className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{district.libraries}</p>
                    <p className="text-xs text-muted-foreground">Bibliotecas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{district.readingPoints}</p>
                    <p className="text-xs text-muted-foreground">Puntos de lectura</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
