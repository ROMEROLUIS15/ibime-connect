import { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import {
  BookOpen,
  BookText,
  Download,
  ExternalLink,
  Eye,
  GraduationCap,
  Instagram,
  Mail,
  MapPin,
  Palette,
  Target,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BIENAL,
  CARMEN_DELIA_BENCOMO,
  CATALOG,
  COLLECTIONS,
  CONTACT,
  FONDO_EDITORIAL,
  getBookCover,
  type Book,
  type CollectionId,
} from '@/data/fondo-editorial';

type Filter = 'todos' | CollectionId;

// Un icono por servicio, en el orden de FONDO_EDITORIAL.services.
const SERVICE_ICONS = [BookText, GraduationCap, BookOpen];

const COLLECTION_LABEL = new Map(COLLECTIONS.map((c) => [c.id, c.label]));

const COUNT_BY_COLLECTION = new Map(
  COLLECTIONS.map((c) => [c.id, CATALOG.filter((b) => b.collections.includes(c.id)).length])
);

const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' } as const;

const BookCard = ({ book }: { book: Book }) => {
  const cover = getBookCover(book.id);

  return (
    <article className="card-institutional h-full flex flex-row sm:flex-col gap-4 p-4 sm:p-5">
      <div className="w-24 shrink-0 self-start sm:w-full aspect-[3/4] rounded-lg bg-muted overflow-hidden flex items-center justify-center">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" className="object-contain h-full w-full" />
        ) : (
          <BookOpen className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {book.collections.map((id) => (
            <span key={id} className="badge-institutional text-xs">
              {COLLECTION_LABEL.get(id)}
            </span>
          ))}
        </div>
        <h3 className="text-base sm:text-lg font-display font-bold text-foreground mb-1 break-words">{book.title}</h3>
        {book.author && <p className="text-sm text-foreground/80">{book.author}</p>}
        {book.illustrator && (
          <p className="text-sm text-muted-foreground">Ilustraciones de {book.illustrator}</p>
        )}
        {book.credits && <p className="text-xs text-muted-foreground mt-1">{book.credits}</p>}
        {book.synopsis && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-4">{book.synopsis}</p>
        )}

        <div className="mt-auto pt-4 flex flex-col items-start gap-2">
          <Button asChild size="sm" className="btn-hero">
            <a
              href={book.pdfUrl}
              {...EXTERNAL}
              aria-label={`Descargar PDF de ${book.title} (se abre en una pestaña nueva)`}
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Descargar PDF
            </a>
          </Button>
          {book.coloringPdfUrl && (
            <a
              href={book.coloringPdfUrl}
              {...EXTERNAL}
              aria-label={`Versión para colorear de ${book.title} (se abre en una pestaña nueva)`}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              <Palette className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Versión para colorear
            </a>
          )}
          <a
            href={book.postUrl}
            {...EXTERNAL}
            aria-label={`Ficha en el blog de ${book.title} (se abre en una pestaña nueva)`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Ficha en el blog
            <ExternalLink className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
};

const FondoEditorialPage = () => {
  const [filter, setFilter] = useState<Filter>('todos');

  const visibleBooks = useMemo(
    () => (filter === 'todos' ? CATALOG : CATALOG.filter((b) => b.collections.includes(filter))),
    [filter]
  );

  const filterButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background text-foreground border-border hover:bg-muted'
    }`;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium rounded-full bg-white/10 text-white border border-white/30 backdrop-blur-sm">
              Publicaciones
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Fondo <span style={{ color: '#FFFFFF' }}>Editorial</span>
              <span className="block mt-2">Carmen Delia Bencomo</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Editamos y publicamos obras sobre cultura y literatura merideña, con especial atención en la
              promoción de la lectura. Descarga nuestro catálogo en PDF.
            </p>
            <Button asChild className="btn-hero">
              <a href="#catalogo">Ver catálogo</a>
            </Button>
          </div>
        </section>

        {/* Quiénes somos */}
        <section className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Quiénes <span className="text-gradient">somos</span>
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4 text-lg text-muted-foreground mb-12">
              {FONDO_EDITORIAL.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="card-institutional">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Misión</h3>
                <p className="text-muted-foreground">{FONDO_EDITORIAL.mission}</p>
              </div>
              <div className="card-institutional">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                  <Eye className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Visión</h3>
                <p className="text-muted-foreground">{FONDO_EDITORIAL.vision}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nuestro trabajo editorial */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Nuestro <span className="text-gradient">Trabajo Editorial</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FONDO_EDITORIAL.services.map((service, index) => {
                const Icon = SERVICE_ICONS[index] ?? BookText;
                return (
                  <div key={service.title} className="card-institutional text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Catálogo: scroll-mt-24 compensa la barra de navegación fija */}
        <section id="catalogo" className="py-20 section-pattern scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Nuestro <span className="text-gradient">catálogo</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {CATALOG.length} libros disponibles para descargar en PDF desde el blog del Fondo Editorial.
              </p>
            </div>

            <div
              role="group"
              aria-label="Filtrar por colección"
              className="flex flex-wrap justify-center gap-2 mb-6"
            >
              <button
                type="button"
                aria-pressed={filter === 'todos'}
                onClick={() => setFilter('todos')}
                className={filterButtonClass(filter === 'todos')}
              >
                Todos
              </button>
              {COLLECTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={filter === c.id}
                  onClick={() => setFilter(c.id)}
                  className={filterButtonClass(filter === c.id)}
                >
                  {c.label} ({COUNT_BY_COLLECTION.get(c.id)})
                </button>
              ))}
            </div>

            <p aria-live="polite" className="text-center text-sm text-muted-foreground mb-8">
              Mostrando {visibleBooks.length} {visibleBooks.length === 1 ? 'libro' : 'libros'}
            </p>

            <ul className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleBooks.map((book) => (
                <li key={book.id}>
                  <BookCard book={book} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Carmen Delia Bencomo y Bienal */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                  Carmen Delia <span className="text-gradient">Bencomo</span>
                </h2>
                <p className="text-muted-foreground mb-6">La autora que da nombre al Fondo</p>
                <div className="space-y-4 text-muted-foreground mb-6">
                  {CARMEN_DELIA_BENCOMO.summary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">Premios</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground mb-6">
                  {CARMEN_DELIA_BENCOMO.awards.map((award) => (
                    <li key={award}>{award}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground mb-6">
                  <span className="font-semibold text-foreground">Obra literaria:</span>{' '}
                  {CARMEN_DELIA_BENCOMO.works}
                </p>
                <a
                  href={CARMEN_DELIA_BENCOMO.profileUrl}
                  {...EXTERNAL}
                  className="inline-flex items-center font-medium text-primary hover:underline"
                >
                  Leer su biografía completa
                  <ExternalLink className="w-4 h-4 ml-1.5" aria-hidden="true" />
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              </div>

              <div className="card-institutional self-start">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">{BIENAL.name}</h2>
                <p className="text-muted-foreground mb-4">{BIENAL.description}</p>
                <p className="text-muted-foreground mb-6">{BIENAL.winner}</p>
                <a
                  href={BIENAL.url}
                  {...EXTERNAL}
                  className="inline-flex items-center font-medium text-primary hover:underline"
                >
                  Ver la memoria gráfica de la I Bienal
                  <ExternalLink className="w-4 h-4 ml-1.5" aria-hidden="true" />
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="py-20 section-pattern">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                <span className="text-gradient">Contacto</span>
              </h2>
            </div>
            <ul className="max-w-2xl mx-auto space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 shrink-0 text-primary" aria-hidden="true" />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${CONTACT.email}`} className="text-primary hover:underline break-all">
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Instagram className="w-5 h-5 mt-1 shrink-0 text-primary" aria-hidden="true" />
                <a href={CONTACT.instagramUrl} {...EXTERNAL} className="text-primary hover:underline">
                  {CONTACT.instagramHandle}
                  <ExternalLink className="inline w-3.5 h-3.5 ml-1" aria-hidden="true" />
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <BookText className="w-5 h-5 mt-1 shrink-0 text-primary" aria-hidden="true" />
                <a href={CONTACT.blogUrl} {...EXTERNAL} className="text-primary hover:underline">
                  Blog del Fondo Editorial
                  <ExternalLink className="inline w-3.5 h-3.5 ml-1" aria-hidden="true" />
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default FondoEditorialPage;
