import { useState, useCallback, useEffect, type JSX } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, MapPin, Users, ArrowLeft, ArrowRight } from "lucide-react";

import plan1 from "@/assets/plan 1.jpeg";
import plan2 from "@/assets/plan 2.jpeg";
import plan3 from "@/assets/plan 3.jpeg";
import plan4 from "@/assets/plan 4.jpeg";
import plan5 from "@/assets/plan 5.jpeg";
import plan6 from "@/assets/plan 6.jpeg";
import plan7 from "@/assets/plan 7.jpeg";
import plan8 from "@/assets/plan 8.jpeg";
import plan9 from "@/assets/plan 9.jpeg";

interface Photo {
  id: number;
  image: string;
  title: string;
  description: string;
  location: string;
}

const PHOTOS: Photo[] = [
  {
    id: 1,
    image: plan1,
    title: "Bienvenida al Plan Vacacional",
    description: "Dimos inicio con una calurosa recepción a todos los niños y niñas merideños. Actividades de integración, presentación del equipo facilitador y un recorrido por las instalaciones de la biblioteca.",
    location: "Biblioteca Central",
  },
  {
    id: 2,
    image: plan2,
    title: "Taller de Lectura Creativa",
    description: "Los pequeños exploraron el maravilloso mundo de los libros a través de cuentos interactivos, títeres y dramatizaciones. Fomentamos el amor por la lectura desde temprana edad.",
    location: "Sala Infantil",
  },
  {
    id: 3,
    image: plan3,
    title: "Arte y Manualidades",
    description: "Taller de expresión plástica donde los niños crearon sus propias obras de arte inspiradas en la cultura merideña. Pintura, arcilla y materiales reciclados fueron los protagonistas.",
    location: "Taller de Arte",
  },
  {
    id: 4,
    image: plan4,
    title: "Cuentacuentos",
    description: "Sesiones de narración oral con historias tradicionales venezolanas. Los niños viajaron con su imaginación a través de leyendas y mitos de nuestra región andina.",
    location: "Auditorio",
  },
  {
    id: 5,
    image: plan5,
    title: "Cine Infantil Educativo",
    description: "Proyección de películas educativas con valores como la amistad, el respeto y la cooperación. Espacio de reflexión y conversación guiada después de cada función.",
    location: "Sala Audiovisual",
  },
  {
    id: 6,
    image: plan6,
    title: "Juegos Tradicionales",
    description: "Rescatando nuestros juegos tradicionales: trompo, perinola, papagayos y carreras de sacos. Una jornada al aire libre llena de diversión y sana competencia.",
    location: "Plaza Principal",
  },
  {
    id: 7,
    image: plan7,
    title: "Taller de Música",
    description: "Los niños descubrieron instrumentos musicales típicos de los Andes venezolanos. Aprendieron ritmos básicos y formaron un coro infantil con canciones tradicionales.",
    location: "Sala de Música",
  },
  {
    id: 8,
    image: plan8,
    title: "Actividades Recreativas",
    description: "Jornada de actividades recreativas donde los niños disfrutaron de dinámicas grupales, juegos cooperativos y momentos de esparcimiento al aire libre.",
    location: "Jardines de la Biblioteca",
  },
  {
    id: 9,
    image: plan9,
    title: "Clausura y Exhibición",
    description: "Cerramos con broche de oro presentando a los padres todo lo aprendido. Exhibición de manualidades, presentación musical y entrega de diplomas a los participantes.",
    location: "Biblioteca Central",
  },
];

export function PlanVacacionalSection(): JSX.Element {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrentIndex(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });

    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [api]);

  const openDialog = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  return (
    <section id="plan-vacacional" className="py-20 bg-gradient-institutional text-primary-foreground shadow-inner">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block px-6 py-2.5 mb-4 text-sm md:text-base font-semibold rounded-full bg-white text-ibime-blue shadow-sm">
            Edición 2026
          </span>
          <h2 
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-wide flex justify-center gap-3 md:gap-5 flex-wrap" 
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            <div className="flex">
              <span className="text-white rotate-[-4deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">P</span>
              <span className="text-[#009B3A] rotate-[3deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">l</span>
              <span className="text-[#CE1126] rotate-[5deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">a</span>
              <span className="text-[#FCD116] rotate-[-2deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">n</span>
            </div>
            <div className="flex">
              <span className="text-[#0072CE] rotate-[4deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">V</span>
              <span className="text-[#009B3A] rotate-[-3deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">a</span>
              <span className="text-[#CE1126] rotate-[2deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">c</span>
              <span className="text-[#FCD116] rotate-[-5deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">a</span>
              <span className="text-white rotate-[3deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">c</span>
              <span className="text-[#0072CE] rotate-[1deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">i</span>
              <span className="text-[#009B3A] rotate-[-4deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">o</span>
              <span className="text-[#CE1126] rotate-[4deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">n</span>
              <span className="text-[#FCD116] rotate-[-2deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">a</span>
              <span className="text-white rotate-[2deg] inline-block drop-shadow-md hover:scale-110 transition-transform cursor-default">l</span>
            </div>
          </h2>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto text-lg leading-relaxed">
            Durante agosto 2026, la red de bibliotecas públicas del estado Mérida
            ofreció un plan vacacional lleno de aprendizaje, cultura y diversión
            para los niños y niñas de la región.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-6xl mx-auto px-4 md:px-12 lg:px-24 xl:px-28">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-8 lg:-ml-12 py-8">
              {PHOTOS.map((photo, index) => {
                const isActive = currentIndex === index;
                return (
                <CarouselItem
                  key={photo.id}
                  className="basis-full sm:basis-4/5 md:basis-1/2 lg:basis-1/3 pl-4 md:pl-8 lg:pl-12"
                >
                  <button
                    onClick={() => openDialog(photo)}
                    className={`w-full text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD116] focus-visible:ring-offset-2 rounded-2xl transition-all duration-500 ease-out ${isActive ? "scale-100 md:scale-110 opacity-100 z-10 shadow-2xl" : "scale-100 md:scale-90 opacity-60 hover:opacity-80 z-0"}`}
                    aria-label={`Ver detalle: ${photo.title}`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#E5E7EB]">
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-lg font-display font-bold text-primary-foreground mb-1">
                          {photo.title}
                        </h3>
                        <p className="text-sm text-primary-foreground/80 line-clamp-1">
                          {photo.location}
                        </p>
                      </div>
                      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </button>
                </CarouselItem>
                );
              })}
            </CarouselContent>
            <button
              onClick={() => api?.scrollNext()}
              className="hidden lg:flex absolute left-0 lg:-left-16 xl:-left-20 top-1/2 -translate-y-1/2 h-14 w-14 items-center justify-center rounded-full bg-white text-[#0072CE] shadow-xl hover:bg-gray-100 hover:scale-110 transition-all z-20"
              aria-label="Mover a la izquierda"
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            <button
              onClick={() => api?.scrollPrev()}
              className="hidden lg:flex absolute right-0 lg:-right-16 xl:-right-20 top-1/2 -translate-y-1/2 h-14 w-14 items-center justify-center rounded-full bg-white text-[#0072CE] shadow-xl hover:bg-gray-100 hover:scale-110 transition-all z-20"
              aria-label="Mover a la derecha"
            >
              <ArrowRight className="w-8 h-8" />
            </button>
          </Carousel>
        </div>

        {/* Bottom info */}
        <div className="text-center mt-10">
          <p className="text-primary-foreground/80 text-sm">
            Haz clic en cualquier foto para ver más detalles.
          </p>
        </div>
      </div>

      {/* Dialog / Modal */}
      <Dialog open={selectedPhoto !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="w-[95vw] max-w-5xl p-0 overflow-hidden rounded-2xl gap-0">
          {selectedPhoto && (
            <>
              <div className="relative bg-muted">
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.title}
                  className="w-full max-h-[75vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent p-6 pt-16">
                  <DialogTitle className="text-2xl md:text-3xl font-display font-bold text-primary-foreground">
                    {selectedPhoto.title}
                  </DialogTitle>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                <DialogDescription className="text-foreground/80 text-base leading-relaxed">
                  {selectedPhoto.description}
                </DialogDescription>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-accent" />
                    Agosto 2026
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent" />
                    {selectedPhoto.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-accent" />
                    Plan Vacacional
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default PlanVacacionalSection;