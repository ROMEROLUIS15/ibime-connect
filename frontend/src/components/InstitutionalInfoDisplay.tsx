import { Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import libraryActivity from '@/assets/library-activity.jpg';

interface InstitutionalInfoDisplayProps {
  className?: string;
}

const content = {
  date: '',
  category: 'Institucional',
  title: 'Conformación del Congreso Nacional Constituyente Obrero',
  description: `Cumpliendo con el llamado a la patria con la clase obrera, se llevó a cabo la convocatoria para la Conformación del Congreso Nacional Constituyente Obrero dentro del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, trabajadores y trabajadoras unidos participaron activamente y sin dilaciones en el proceso eleccionario de los Voceros y Voceras.

  Este es un llamado a la renovación profunda de nuestras estructuras, basado en las 7 grandes transformaciones impulsadas por nuestro Presidente Obrero Nicolás Maduro y el Gobernador Arnaldo Sánchez.`,
  readMoreLink: '/donation-criteria',
};

export const InstitutionalInfoDisplay = ({ className }: InstitutionalInfoDisplayProps) => {
  const today = new Date();
  const fechaFormateada = today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const fechaISO = today.toISOString().split('T')[0];
  return (
    <article className={`card-institutional overflow-hidden p-0 ${className ?? ''}`}>
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative overflow-hidden aspect-video md:aspect-auto">
          <img
            src={libraryActivity}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-4 left-4 px-4 py-2 text-sm font-medium rounded-full bg-ebime-red text-primary-foreground">
            Destacado
          </span>
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <Calendar className="w-4 h-4" />
            <time dateTime={fechaISO}>{fechaFormateada}</time>
            <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
              {content.category}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
            {content.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {content.description.split('\n\n')[0].trim()}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6 italic">
            {content.description.split('\n\n')[1]?.trim()}
          </p>
          <Link
            to={content.readMoreLink}
            className="inline-flex items-center text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            Leer más
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default InstitutionalInfoDisplay;
