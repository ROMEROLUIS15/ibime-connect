import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import libraryBuilding from '@/assets/library-building.webp';
import communityEvent from '@/assets/community-event.webp';
import espacio1 from '@/assets/ESPACIO BPC 1.webp';
import espacio2 from '@/assets/ESPACIO BPC 2.webp';
import espacio3 from '@/assets/ESPACIO BPC 3.webp';
import espacio4 from '@/assets/ESPACIO BPC 4.webp';
import espacio5 from '@/assets/ESPACIO BPC 5.webp';
import espacio6 from '@/assets/ESPACIO BPC 6.webp';
import espacio7 from '@/assets/ESPACIO BPC 7.webp';

const AUTOPLAY_MS = 3500;

interface Photo {
  src: string;
  alt: string;
}

interface LinkGallery {
  id: number;
  image: string;
  href: string;
  title: string;
  description: string;
  overlay: string;
}

interface PhotosGallery {
  id: number;
  photos: Photo[];
  title: string;
  description: string;
}

type Gallery = LinkGallery | PhotosGallery;

const espacioPhotos: Photo[] = [
  {
    src: espacio1,
    alt: 'Estanterías con libros junto a mesas de lectura; al fondo, usuarios leyendo en la sala contigua',
  },
  {
    src: espacio2,
    alt: 'Sala de lectura amplia con mesas, sillas y estanterías de libros en las paredes',
  },
  {
    src: espacio3,
    alt: 'Mesas de lectura rodeadas de estanterías, con libros en exhibición y un globo terráqueo',
  },
  {
    src: espacio4,
    alt: 'Mesas de estudio con libros y papeles frente a estanterías bajo grandes ventanales',
  },
  { src: espacio5, alt: 'Pasillo con una exposición de obras gráficas enmarcadas' },
  {
    src: espacio6,
    alt: 'Sala con estanterías de madera, una mesa de trabajo en forma de L y puestos de computación',
  },
  {
    src: espacio7,
    alt: 'Sala de computación con varios equipos, mesas de trabajo y estanterías',
  },
];

const galleries: Gallery[] = [
  {
    id: 1,
    image: libraryBuilding,
    href: '#contacto',
    title: 'Contactos',
    description: 'Encuentra la biblioteca más cercana',
    overlay: 'bg-ebime-blue/80',
  },
  {
    id: 2,
    photos: espacioPhotos,
    title: 'Espacios',
    description: 'Conoce nuestras instalaciones',
  },
  {
    id: 3,
    image: communityEvent,
    href: '#eventos',
    title: 'Actividades',
    description: 'Participa en eventos culturales',
    overlay: 'bg-ebime-green/80',
  },
];

const EspaciosCarousel = ({ photos, title, description }: PhotosGallery) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Índice de la foto actual, sincronizado con embla
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  // Respeta la preferencia de movimiento reducido del sistema
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const paused = hovered || focused;

  // Al depender de `current`, cualquier cambio de foto reinicia la cuenta atrás
  useEffect(() => {
    if (!api || paused || reducedMotion) return;
    const id = setTimeout(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [api, current, paused, reducedMotion]);

  return (
    <Carousel
      opts={{ loop: true }}
      setApi={setApi}
      aria-label="Espacios: fotos de nuestras instalaciones"
      className="group relative overflow-hidden rounded-2xl select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setFocused(false);
      }}
    >
      <CarouselContent className="ml-0">
        {photos.map((photo, i) => (
          <CarouselItem
            key={photo.src}
            className="aspect-[4/5] overflow-hidden pl-0"
            aria-label={`${i + 1} de ${photos.length}`}
            aria-hidden={i !== current}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Gradiente inferior para legibilidad del texto */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      {/* Solo se ocultan en dispositivos con hover; en táctiles siempre son visibles */}
      <CarouselPrevious
        aria-label="Foto anterior"
        className="left-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2 border-white/20 bg-black/40 text-white backdrop-blur-md transition-opacity hover:bg-black/70 hover:text-white focus-visible:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      />
      <CarouselNext
        aria-label="Foto siguiente"
        className="right-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2 border-white/20 bg-black/40 text-white backdrop-blur-md transition-opacity hover:bg-black/70 hover:text-white focus-visible:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      />

      {/* Indicadores de posición (área táctil de 24x24) */}
      <div className="absolute inset-x-0 bottom-20 z-20 flex justify-center">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Ir a la foto ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            className="group/dot flex h-6 w-6 items-center justify-center"
          >
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-5 bg-white shadow-sm'
                  : 'w-1.5 bg-white/40 group-hover/dot:bg-white/70'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-6">
        <h3 className="mb-1 text-2xl font-display font-bold text-primary-foreground">
          {title}
        </h3>
        <p className="text-sm text-primary-foreground/90">{description}</p>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 h-10 w-10 border-r-2 border-t-2 border-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Carousel>
  );
};

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
          {galleries.map((item, index) =>
            'photos' in item ? (
              <EspaciosCarousel key={item.id} {...item} />
            ) : (
              <a
                key={item.id}
                href={item.href}
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
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
