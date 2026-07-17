import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import {
  BookHeart,
  BookMarked,
  Library,
  Search,
  Package,
  Truck,
  FileCheck,
  Heart,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Calendar,
  Users,
  Building2,
  BookOpen,
  Clock,
} from 'lucide-react';

const stats = [
  { icon: BookOpen, value: '5,000+', label: 'Libros donados' },
  { icon: Building2, value: '50+', label: 'Bibliotecas beneficiadas' },
  { icon: Calendar, value: '10+', label: 'Años del programa' },
  { icon: Users, value: '15,000+', label: 'Lectores impactados' },
];

const criteria = [
  {
    title: 'Estado de conservación',
    description: 'Solo se aceptarán documentos en buen estado',
    icon: BookHeart,
    gradient: 'from-ebime-blue to-ebime-green',
    bgColor: 'bg-ebime-blue/10',
    accentColor: 'text-ebime-blue',
    details: [
      'Libros sin roturas o páginas faltantes',
      'Documentos sin manchas de humedad o moho',
      'Material sin daños por insectos',
      'Cubiertas y lomos en buen estado',
      'Páginas legibles y completas',
    ],
  },
  {
    title: 'Relevancia temática',
    description: 'Materiales relevantes para la colección',
    icon: BookMarked,
    gradient: 'from-ebime-purple to-ebime-blue',
    bgColor: 'bg-ebime-purple/10',
    accentColor: 'text-ebime-purple',
    details: [
      'Contenido educativo y cultural',
      'Obras de interés general o académico',
      'Materiales que complementen colecciones existentes',
      'Publicaciones actualizadas y vigentes',
    ],
  },
  {
    title: 'Tipos de materiales aceptados',
    description: 'Diversos formatos documentales',
    icon: Library,
    gradient: 'from-ebime-green to-ebime-yellow',
    bgColor: 'bg-ebime-green/10',
    accentColor: 'text-ebime-green',
    details: [
      'Libros y folletos',
      'Revistas y publicaciones periódicas',
      'Materiales audiovisuales',
      'Documentos digitales',
      'Material de referencia y consulta',
    ],
  },
];

const timelineSteps = [
  {
    icon: Search,
    title: 'Evalúa',
    description: 'Revisa que tus materiales cumplan con los criterios de aceptación.',
  },
  {
    icon: Package,
    title: 'Prepara',
    description: 'Organiza los documentos en buen estado y sepáralos por categorías.',
  },
  {
    icon: Truck,
    title: 'Entrega',
    description: 'Acude a la biblioteca más cercana y entrega tu donación.',
  },
  {
    icon: FileCheck,
    title: 'Recibe constancia',
    description: 'Obtén un comprobante de donación y nuestro agradecimiento.',
  },
];

export const DonationCriteriaPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative py-24 bg-gradient-institutional text-primary-foreground overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-white/10 border border-white/25 backdrop-blur-sm animate-fade-in">
                <Heart className="w-4 h-4" />
                Donaciones
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 mt-6 animate-slide-up">
                Dona conocimiento,<br />
                transforma vidas
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 animate-fade-in">
                Tu donación de libros y materiales bibliográficos ayuda a fortalecer el acceso
                a la educación y la cultura en toda nuestra comunidad.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 btn-hero"
                >
                  Quiero donar
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#criterios"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                >
                  Conocer criterios
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="card-institutional text-center animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-institutional flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Detailed Criteria */}
        <section id="criterios" className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="badge-institutional mb-4">Criterios de aceptación</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                Criterios <span className="text-gradient">detallados</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Asegúrate de que tus materiales cumplan con los siguientes requisitos antes de donar.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {criteria.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="card-institutional group relative overflow-hidden animate-slide-up hover:border-ebime-blue/20"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${item.gradient}`} />

                    <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${item.bgColor} opacity-50`} />

                    <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${item.accentColor}`} />
                      </div>

                      <h3 className="text-xl font-display font-bold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className={`text-sm font-medium mb-4 ${item.accentColor}`}>
                        {item.description}
                      </p>

                      <ul className="space-y-2.5">
                        {item.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-ebime-blue">
                            <div className={`w-5 h-5 rounded-full ${item.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <div className="w-2.5 h-2.5 rounded-full bg-ebime-blue" />
                            </div>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="badge-institutional mb-4">Proceso</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                Así funciona <span className="text-gradient">la donación</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Donar es fácil y rápido. Sigue estos sencillos pasos.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-4 gap-6 relative">
                <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-ebime-blue via-ebime-purple to-ebime-green" />

                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={index}
                      className="relative flex flex-col items-center text-center animate-fade-in"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-institutional text-primary-foreground text-sm font-bold flex items-center justify-center z-10">
                        {index + 1}
                      </div>

                      <div className="w-24 h-24 rounded-full bg-white border-2 border-ebime-blue/30 flex items-center justify-center mb-5 shadow-lg group hover:border-ebime-blue hover:shadow-xl transition-all">
                        <Icon className="w-10 h-10 text-ebime-blue group-hover:scale-110 transition-transform" />
                      </div>

                      <h3 className="text-lg font-display font-bold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-[200px]">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Info + CTA */}
        <section id="contacto" className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="card-institutional relative overflow-hidden">
                <div className="relative z-10 grid md:grid-cols-2 gap-8">
                  <div>
                    <span className="badge-institutional mb-4 inline-flex">Información adicional</span>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                      ¿Listo para donar?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Todas las donaciones serán evaluadas por nuestro equipo técnico para determinar
                      su inclusión en el acervo bibliográfico. Nos reservamos el derecho de aceptar o
                      rechazar donaciones según los criterios establecidos.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ebime-blue/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-ebime-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Dirección</p>
                          <p className="text-muted-foreground text-sm">
                            Sector Glorias Patrias, Calle 1 Los Eucaliptos,<br />
                            entre Av. Gonzalo Picón y Tulio Febres
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ebime-blue/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-ebime-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Horario de Atención</p>
                          <p className="text-muted-foreground text-sm">
                            De Lunes a Viernes<br />
                            8:00 a.m a 12:00 p.m<br />
                            1:00 p.m a 4:00 p.m
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ebime-blue/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-ebime-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Teléfono</p>
                          <p className="text-muted-foreground text-sm">0274-2623898</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ebime-blue/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-ebime-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Correo Electrónico</p>
                          <p className="text-muted-foreground text-sm">contactoibime@gmail.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-ebime-blue/5 to-ebime-green/5 border border-border/70">
                    <div className="w-20 h-20 rounded-full bg-gradient-institutional flex items-center justify-center mb-6">
                      <Heart className="w-10 h-10 text-primary-foreground animate-pulse-soft" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground text-center mb-3">
                      ¡Tu donación importa!
                    </h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-xs">
                      Cada libro donado abre puertas al conocimiento y la cultura.
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 btn-hero"
                    >
                      Quiero donar ahora
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default DonationCriteriaPage;
