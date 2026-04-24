import { BookOpen, Users } from 'lucide-react';
import { getCloudinaryVideoUrl, getCloudinaryPosterUrl } from '@/lib/cloudinary';

// 1. Capa de Datos (Separada de la Interfaz)
const VIDEOS_DATA = [
  {
    id: 'escritores-meridenos',
    title: 'Escritores Merideños',
    description: 'Un recorrido por la vida y obra de los escritores más emblemáticos que han dejado su huella en la literatura del estado Mérida.',
    publicId: 'WhatsApp_Video_2026-04-22_at_11.10.15_AM_1_cqmcwc',
    icon: BookOpen,
    classes: {
      bgIcon: 'bg-ebime-blue/20',
      textIcon: 'text-ebime-blue',
      glow: 'bg-ebime-blue/10'
    },
    fallbackPoster: 'https://images.unsplash.com/photo-1455390582262-044cdead27d8?q=80&w=1080&auto=format&fit=crop'
  },
  {
    id: 'heroinas-venezuela',
    title: 'Heroínas de Venezuela',
    description: 'Conoce la valiente historia de las mujeres que lucharon por la independencia y forjaron el destino de nuestra nación.',
    publicId: 'WhatsApp_Video_2026-04-22_at_11.10.15_AM_xxzpjn',
    icon: Users,
    classes: {
      bgIcon: 'bg-ebime-blue/20',
      textIcon: 'text-ebime-blue',
      glow: 'bg-ebime-blue/10'
    },
    fallbackPoster: 'https://images.unsplash.com/photo-1534430263654-e6552b7b51b7?q=80&w=1080&auto=format&fit=crop'
  }
];

// 2. Capa de Presentación (Renderiza a partir de los datos)
export const CulturalVideosSection = () => {
  return (
    <section id="videoteca-cultural" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="badge-institutional mb-4">Videoteca Histórica</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Cápsulas <span className="text-gradient">Culturales</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explora nuestro contenido audiovisual destacado sobre la historia, 
            la literatura y los personajes ilustres de nuestra región y país.
          </p>
        </div>

        {/* Video Grid Dinámico */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {VIDEOS_DATA.map((video) => {
            const IconComponent = video.icon;
            
            return (
              <div key={video.id} className="card-institutional relative overflow-hidden group flex flex-col h-full">
                {/* Decorative Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${video.classes.glow} rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`} />
                
                <div className="relative z-10 flex flex-col flex-1">
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 ${video.classes.bgIcon} rounded-lg`}>
                      <IconComponent className={`w-6 h-6 ${video.classes.textIcon}`} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground">
                      {video.title}
                    </h3>
                  </div>
                  
                  {/* Video Player */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/5 ring-1 ring-border shadow-inner mb-4 mt-auto">
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      poster={getCloudinaryPosterUrl(video.publicId) || video.fallbackPoster}
                    >
                      <source src={getCloudinaryVideoUrl(video.publicId)} type="video/mp4" />
                      Tu navegador no soporta el elemento de video.
                    </video>
                  </div>
                  
                  {/* Card Footer */}
                  <p className="text-muted-foreground mt-2">
                    {video.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CulturalVideosSection;
