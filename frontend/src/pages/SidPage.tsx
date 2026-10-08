import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { Monitor, BookOpen, Headphones, Accessibility } from 'lucide-react';

const features = [
  {
    icon: Monitor,
    title: 'Recursos digitales',
    description: 'El SID permite a los usuarios de la biblioteca acceder a recursos digitales.',
  },
  {
    icon: BookOpen,
    title: 'Colecciones en Braille',
    description: 'La Sala de Tiflotecnología tiene a disposición colecciones en Braille.',
  },
  {
    icon: Headphones,
    title: 'Audiolibros',
    description: 'La sala ofrece audiolibros. Conoce también el programa Libro Hablado.',
    link: { to: '/libro-hablado', label: 'Ir a Libro Hablado' },
  },
  {
    icon: Accessibility,
    title: 'Talleres de Braille',
    description:
      'Talleres de lectura y escritura Braille para personas con discapacidad visual, como parte del programa de inclusión para personas con discapacidad visual y auditiva.',
  },
];

const SidPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <span
              className="inline-block px-4 py-2 mb-6 text-sm font-bold rounded-full bg-white/10 text-white border border-white/30 backdrop-blur-sm"
              style={{ color: '#FFFFFF' }}
            >
              Inclusión y acceso a la información
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}
            >
              Servicio de Información <span style={{ color: '#FFFFFF' }}>Digital</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              El SID trabaja en conjunto con la Sala de Tiflotecnología de la Biblioteca Pública
              Central Estadal Simón Bolívar para que los usuarios accedan a recursos digitales y
              para facilitar el acceso a la información a las personas con discapacidad visual.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
                Qué <span className="text-gradient">encontrarás</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="card-institutional text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  {feature.link && (
                    <Link
                      to={feature.link.to}
                      className="inline-block mt-3 text-primary font-semibold underline-offset-4 hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {feature.link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="card-institutional text-center">
              <h2 className="text-3xl font-display font-bold text-foreground mb-6" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
                Dónde está
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                En la Biblioteca Pública Central Estadal Simón Bolívar, municipio Libertador, Mérida.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                El SID y la Sala de Tiflotecnología se reinauguraron el 25 de septiembre de 2023, en
                el 42.º aniversario de la biblioteca.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default SidPage;
