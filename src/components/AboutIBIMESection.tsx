import { Building2, Library, Users, BookMarked } from 'lucide-react';

export const AboutIBIMESection = () => {
  return (
    <section id="ibime" className="py-20 section-pattern">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="badge-institutional mb-4">Sobre Nosotros</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            ¿Qué es <span className="text-gradient">IBIME</span>?
          </h2>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <div className="card-institutional relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-ebime-purple/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-ebime-blue/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              {/* Icon Grid */}
              <div className="flex justify-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-ebime-blue flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-ebime-purple flex items-center justify-center">
                  <Library className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-ebime-green flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                  <BookMarked className="w-8 h-8 text-accent-foreground" />
                </div>
              </div>

              {/* Main Text */}
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
                  Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  Es el ente responsable de la ejecución de las políticas bibliotecarias y de información 
                  que se ofrecen a toda la comunidad merideña. Comprometidos con la educación, la cultura 
                  y el desarrollo integral de nuestra región, trabajamos cada día para acercar el conocimiento 
                  a todos los ciudadanos.
                </p>
              </div>

              {/* Decorative Line */}
              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="h-1 w-12 rounded-full bg-ebime-yellow" />
                <div className="h-1 w-8 rounded-full bg-ebime-red" />
                <div className="h-1 w-12 rounded-full bg-ebime-purple" />
                <div className="h-1 w-8 rounded-full bg-ebime-blue" />
                <div className="h-1 w-12 rounded-full bg-ebime-green" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutIBIMESection;
