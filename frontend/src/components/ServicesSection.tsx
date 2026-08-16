import { MapPin, Library, BookOpen, ZoomIn, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AXES, type Axis, type Library as LibraryEntry } from '@/data/library-network';
import ejeMetropolitano from '@/assets/eje-metropolitano.png';
import ejeMocoties from '@/assets/eje-mocoties.png';
import ejePanamericano from '@/assets/eje-panamericano.png';
import ejeParamo from '@/assets/eje-paramo.png';
import ejePueblosSur from '@/assets/eje-pueblos-del-sur.png';

/** Presentación de cada eje: mapa y degradado institucional del recuadro. */
const axisPresentation: Record<number, { image: string; color: string }> = {
  1: { image: ejeMetropolitano, color: 'from-ebime-blue to-ebime-purple' },
  2: { image: ejeMocoties, color: 'from-ebime-purple to-ebime-red' },
  3: { image: ejePanamericano, color: 'from-ebime-red to-ebime-yellow' },
  4: { image: ejeParamo, color: 'from-ebime-yellow to-ebime-red' },
  5: { image: ejePueblosSur, color: 'from-ebime-purple to-ebime-blue' },
};

const UNDER_CONSTRUCTION_COLOR = 'from-ebime-yellow to-ebime-green';

/**
 * Ficha individual de una biblioteca: se abre al pulsar su entrada en el
 * directorio y muestra únicamente el nombre oficial y su ubicación.
 *
 * La ubicación es la rotulada en el mapa del eje —localidad o municipio—,
 * no una dirección postal: los mapas no registran calle ni avenida.
 */
const LibraryLocationDialog = ({
  axisName,
  library,
}: {
  axisName: string;
  library: LibraryEntry;
}) => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 text-left rounded-lg border border-border bg-background p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-accent/60 group/lib focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-display font-semibold text-foreground leading-snug">
          {library.name}
        </span>
        <MapPin
          className="w-4 h-4 text-accent shrink-0 opacity-60 group-hover/lib:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-lg bg-card rounded-xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold text-foreground pr-6">
          {library.name}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Ubicación registrada en el mapa del {axisName}.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-5 shadow-[var(--shadow-sm)]">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--ebime-navy))] flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-display font-semibold text-muted-foreground mb-1">Ubicación</p>
          {library.locality && (
            <p className="text-foreground font-medium leading-relaxed">{library.locality}</p>
          )}
          <p className="text-foreground font-medium leading-relaxed">
            Municipio {library.municipality}
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

/**
 * Directorio de bibliotecas de un eje. Los datos provienen del mapa
 * institucional del eje (ver `data/library-network.ts`).
 */
const AxisDirectoryDialog = ({ axis, children }: { axis: Axis; children: JSX.Element }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col overflow-hidden bg-card rounded-xl">
      <DialogHeader className="shrink-0 pb-4 border-b border-border">
        <span className="badge-institutional self-start mb-2">Red Bibliotecaria</span>
        <DialogTitle className="text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
          <Library className="w-6 h-6 text-accent shrink-0" aria-hidden="true" />
          {axis.name}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          {axis.libraries.length} bibliotecas registradas en los municipios{' '}
          {axis.municipalities.join(', ')} del estado Mérida.
        </DialogDescription>
      </DialogHeader>

      <ul className="flex-1 overflow-y-auto pr-2 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 list-none">
        {axis.libraries.map((lib) => (
          <li key={`${axis.id}-${lib.name}`}>
            <LibraryLocationDialog axisName={axis.name} library={lib} />
          </li>
        ))}
      </ul>
    </DialogContent>
  </Dialog>
);

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
            Nuestra red cubre los cinco ejes del estado Mérida, acercando el conocimiento
            a cada municipio y comunidad de la entidad.
          </p>
        </div>

        {/* Ejes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AXES.map((axis, index) => {
            const { image, color } = axisPresentation[axis.id];

            return (
              <div
                key={axis.id}
                className="card-institutional group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Mapa del eje: abre el lightbox institucional */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Ampliar el mapa del ${axis.name}`}
                      className={`h-56 w-full rounded-xl mb-5 relative overflow-hidden flex items-center justify-center p-4 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gradient-to-br ${color}`}
                    >
                      {/* Patrón de rejilla institucional, igual que las tarjetas de la red */}
                      <div className="absolute inset-0 opacity-20">
                        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                          <pattern id={`grid-map-${axis.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
                          </pattern>
                          <rect width="100" height="100" fill={`url(#grid-map-${axis.id})`} />
                        </svg>
                      </div>
                      <img
                        src={image}
                        alt={`Mapa del ${axis.name}`}
                        className="relative max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Pista visual de que el mapa se puede ampliar */}
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                        <span className="flex items-center gap-1.5 rounded-lg bg-background/95 px-3 py-1.5 text-sm font-medium text-foreground opacity-0 shadow-[var(--shadow-md)] group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-4 h-4" aria-hidden="true" /> Ampliar mapa
                        </span>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl bg-card rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-display font-bold text-foreground">
                        {axis.name}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Mapa de la red bibliotecaria del {axis.name} · estado Mérida
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center overflow-hidden relative rounded-lg p-2">
                      <img
                        src={image}
                        alt={`Mapa ampliado del ${axis.name}`}
                        className="max-h-[75vh] w-auto max-w-full object-contain"
                      />
                      {/* Acceso al directorio del eje desde el mapa ampliado.
                          Navy institucional (#0B1930) sobre blanco: el token
                          --ebime-navy no se reasigna en modo oscuro, así que el
                          contraste del recuadro es estable en cualquier tema. */}
                      <AxisDirectoryDialog axis={axis}>
                        <button
                          type="button"
                          className="absolute bottom-6 right-6 bg-[hsl(var(--ebime-navy))] p-4 rounded-xl shadow-[var(--shadow-card)] border border-white/15 flex items-center gap-4 text-left transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <Library className="w-6 h-6 text-white" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-3xl font-display font-bold text-white leading-none">
                              {axis.libraries.length}
                            </p>
                            <p className="text-sm font-display font-medium text-white/75 mt-1">Bibliotecas</p>
                          </div>
                        </button>
                      </AxisDirectoryDialog>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Contenido */}
                <h3 className="text-xl font-display font-bold text-foreground mb-2">{axis.name}</h3>
                <p className="text-accent font-medium mb-4">Red bibliotecaria · Mérida</p>

                {/* Cifras respaldadas por el mapa del eje */}
                <div className="flex gap-6 mt-auto">
                  <AxisDirectoryDialog axis={axis}>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left group/stat outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent/10 group-hover/stat:bg-accent/20 transition-colors flex items-center justify-center">
                        <Library className="w-5 h-5 text-accent" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground group-hover/stat:text-accent transition-colors">
                          {axis.libraries.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Bibliotecas</p>
                      </div>
                    </button>
                  </AxisDirectoryDialog>

                  {axis.readingPoints != null && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-secondary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{axis.readingPoints}</p>
                        <p className="text-xs text-muted-foreground">Puntos de lectura</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Eje en construcción: sin datos publicables todavía */}
          <div className="card-institutional group overflow-hidden">
            <div className={`h-56 rounded-xl bg-gradient-to-br ${UNDER_CONSTRUCTION_COLOR} mb-5 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <pattern id="grid-under-construction" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid-under-construction)" />
                </svg>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Wrench className="w-12 h-12 text-primary-foreground opacity-80 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                <span className="font-display font-bold text-lg md:text-xl text-primary-foreground/90 uppercase tracking-wider drop-shadow-sm">
                  En Construcción
                </span>
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">En Construcción</h3>
            <p className="text-accent font-medium mb-4">Red bibliotecaria · Mérida</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
