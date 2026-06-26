import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { BookHeart, CheckCircle2, Info, Phone } from 'lucide-react';

const criteria = [
  {
    title: 'Estado de conservación',
    description: 'Solo se aceptarán documentos en buen estado de conservación',
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
    description: 'Los materiales deben ser relevantes para la colección de la biblioteca',
    details: [
      'Contenido educativo y cultural',
      'Obras de interés general o académico',
      'Materiales que complementen las colecciones existentes',
      'Publicaciones actualizadas y vigentes',
    ],
  },
  {
    title: 'Tipos de materiales aceptados',
    description: 'Se aceptan diversos formatos documentales',
    details: [
      'Libros y folletos',
      'Revistas y publicaciones periódicas',
      'Materiales audiovisuales',
      'Documentos digitales',
      'Material de referencia y consulta',
    ],
  },
];

export const DonationCriteriaPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium rounded-full bg-accent/20 text-accent border border-accent/30">
              Donaciones
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 max-w-4xl mx-auto">
              Criterios de donación para la aceptación de materiales Bibliohemerográficos en las Bibliotecas públicas
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Conoce los requisitos y condiciones para donar materiales bibliográficos a nuestra red de bibliotecas públicas.
            </p>
          </div>
        </section>

        {/* Key Criterion */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="card-institutional p-6 md:p-8 border-l-4 border-secondary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                    Estado de conservación
                  </h2>
                  <p className="text-lg text-secondary font-medium mb-2">
                    Solo se aceptarán documentos en buen estado de conservación
                  </p>
                  <p className="text-muted-foreground">
                    Los materiales deben estar libres de daños graves como roturas, manchas, humedad, 
                    deterioro por insectos o páginas faltantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Criteria */}
        <section className="py-16 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Criterios <span className="text-gradient">detallados</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A continuación, se presentan los criterios específicos para la aceptación de donaciones.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {criteria.map((item, index) => (
                <div key={index} className="card-institutional">
                  <h3 className="text-xl font-display font-bold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-secondary font-medium text-sm mb-3">
                    {item.description}
                  </p>
                  <ul className="space-y-2">
                    {item.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="card-institutional p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-institutional flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                    Información adicional
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Todas las donaciones serán evaluadas por nuestro equipo técnico para determinar 
                    su inclusión en el acervo bibliográfico. Nos reservamos el derecho de aceptar o 
                    rechazar donaciones según los criterios establecidos.
                  </p>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Phone className="w-5 h-5 mt-0.5 text-secondary" />
                    <div>
                      <p className="font-medium text-foreground">Contacto</p>
                      <p>Para más información sobre el proceso de donación, contactar a la biblioteca durante el horario de atención.</p>
                    </div>
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
