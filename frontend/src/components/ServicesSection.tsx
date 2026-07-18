import { MapPin, Library, BookOpen } from 'lucide-react';
import ejeMetropolitano from '@/assets/eje-metropolitano.png';
import ejeMocoties from '@/assets/eje-mocoties.png';
import ejePanamericano from '@/assets/eje-panamericano.png';

type District = {
  id: number;
  name: string;
  library: string;
  color: string;
  /** Estadísticas reales del eje; se omiten cuando el dato no está impreso en el mapa. */
  libraries?: number;
  readingPoints?: number;
  /** Mapa del eje. Cuando existe, se muestra dentro del recuadro en lugar del degradado. */
  image?: string;
};

const districts: District[] = [
  {
    id: 1,
    name: 'Eje Metropolitano',
    library: 'Red bibliotecaria · Mérida',
    libraries: 17,
    readingPoints: 1,
    color: 'from-ebime-blue to-ebime-purple',
    image: ejeMetropolitano,
  },
  {
    id: 2,
    name: 'Eje Mocotíes',
    library: 'Red bibliotecaria · Mérida',
    libraries: 11,
    readingPoints: 1,
    color: 'from-ebime-purple to-ebime-red',
    image: ejeMocoties,
  },
  {
    id: 3,
    name: 'Eje Panamericano',
    library: 'Red bibliotecaria · Mérida',
    libraries: 12,
    readingPoints: 1,
    color: 'from-ebime-red to-ebime-yellow',
    image: ejePanamericano,
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
              {/* Map representation: mapa real del eje si existe; si no, el degradado de siempre */}
              {district.image ? (
                <div className="h-56 rounded-xl mb-5 relative overflow-hidden flex items-center justify-center p-4">
                  {/* Fondo con el color del eje, muy suave, para que el vacio no se vea blanco/generico */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${district.color} opacity-[0.08]`} />
                  {/* Patron de rejilla, igual que las tarjetas de abajo, para dar textura */}
                  <div className="absolute inset-0 opacity-[0.12]">
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                      <pattern id={`grid-map-${district.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
                      </pattern>
                      <rect width="100" height="100" fill={`url(#grid-map-${district.id})`} />
                    </svg>
                  </div>
                  <img
                    src={district.image}
                    alt={`Mapa del ${district.name}`}
                    className="relative max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
              ) : (
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
              )}

              {/* Content */}
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                {district.name}
              </h3>
              <p className="text-secondary font-medium mb-4">
                {district.library}
              </p>

              {/* Stats: solo se muestran los datos reales disponibles */}
              {(district.libraries != null || district.readingPoints != null) && (
                <div className="flex gap-6">
                  {district.libraries != null && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <Library className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{district.libraries}</p>
                        <p className="text-xs text-muted-foreground">Bibliotecas</p>
                      </div>
                    </div>
                  )}
                  {district.readingPoints != null && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{district.readingPoints}</p>
                        <p className="text-xs text-muted-foreground">Puntos de lectura</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
