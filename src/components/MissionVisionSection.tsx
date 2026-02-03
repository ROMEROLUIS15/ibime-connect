import { Target, Eye, Heart, Library, Users, BookOpen } from 'lucide-react';

const items = [
  {
    icon: Target,
    title: 'Misión',
    description:
      'Ser el Ente del Gobierno Regional, responsable de la ejecución y cumplimiento de las políticas, normas y procedimientos, que en materia de Servicios de Bibliotecas e Información se ofrecen a toda la comunidad, sin hacer distinción de nacionalidad, credo, raza, sexo, nivel de formación y condición social, todo ello con el objeto de facilitar a toda la población el acceso universal a la información, de apoyar la investigación, la generación del conocimiento y la atención de las necesidades de información, conocimiento, educación, recreación y cultura, contribuyendo así a la formación de ciudadanos creativos, críticos, participativos y comprometidos con el desarrollo productivo del País.',
    color: 'bg-ebime-purple',
  },
  {
    icon: Eye,
    title: 'Visión',
    description:
      'Ser en el Estado Bolivariano de Mérida el organismo garante del principio de libertad de la población en general, principio éste traducido en la posibilidad de seleccionar materiales bibliográficos y no bibliográficos, en diferentes formatos, que constituyen el acervo histórico de la región, nacional y universal, para asegurarse así este derecho insoslayable establecido en la Constitución de la República Bolivariana de Venezuela, para de esta forma contribuir a la creatividad humana y a la formación de un ciudadano soberano, lector, crítico, selectivo, informado, libre y productivo como agente de desarrollo personal y cambio social.',
    color: 'bg-ebime-blue',
  },
  {
    icon: Heart,
    title: 'Valores',
    description:
      'Compromiso con la excelencia, inclusión social, respeto a la diversidad, transparencia en la gestión pública, innovación constante y pasión por el servicio a la comunidad merideña.',
    color: 'bg-ebime-green',
  },
];

const stats = [
  { icon: Library, value: '60', label: 'Bibliotecas' },
  { icon: Users, value: '521', label: 'Personal' },
  { icon: BookOpen, value: '160,000', label: 'Obras Disponibles' },
];

export const MissionVisionSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-institutional mb-4">Identidad Institucional</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Nuestra <span className="text-gradient">Esencia</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Guiados por principios sólidos, trabajamos cada día para acercar el conocimiento y la cultura a todos los merideños.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {items.map((item, index) => (
            <div
              key={index}
              className="card-institutional group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <item.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gradient-institutional rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-2">
              Cifras Institucionales
            </h3>
            <p className="text-primary-foreground/70">Nuestro alcance en el Estado Bolivariano de Mérida</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-accent" />
                </div>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
                  {stat.value}
                </p>
                <p className="text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVisionSection;
