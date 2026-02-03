import { Target, Eye, Heart, Users, BookOpen, Lightbulb } from 'lucide-react';

const items = [
  {
    icon: Target,
    title: 'Misión',
    description:
      'Fomentar el acceso equitativo a la información, la educación y la cultura a través de una red de bibliotecas públicas modernas, promoviendo el desarrollo integral de la comunidad y fortaleciendo los valores democráticos.',
    color: 'bg-ebime-purple',
  },
  {
    icon: Eye,
    title: 'Visión',
    description:
      'Ser reconocidos como la red de bibliotecas públicas líder en innovación y servicio comunitario, transformando vidas a través del conocimiento y consolidándonos como espacios de encuentro cultural y social.',
    color: 'bg-ebime-blue',
  },
  {
    icon: Heart,
    title: 'Valores',
    description:
      'Compromiso con la excelencia, inclusión social, respeto a la diversidad, transparencia en la gestión pública, innovación constante y pasión por el servicio a la comunidad.',
    color: 'bg-ebime-green',
  },
];

const stats = [
  { icon: Users, value: '50,000+', label: 'Usuarios Activos' },
  { icon: BookOpen, value: '200,000+', label: 'Libros Disponibles' },
  { icon: Lightbulb, value: '500+', label: 'Eventos Anuales' },
];

export const MissionVisionSection = () => {
  return (
    <section className="py-20 section-pattern">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-institutional mb-4">Identidad Institucional</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Nuestra <span className="text-gradient">Esencia</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Guiados por principios sólidos, trabajamos cada día para acercar el conocimiento y la cultura a todos los ciudadanos.
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
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gradient-institutional rounded-2xl p-8 md:p-12">
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
