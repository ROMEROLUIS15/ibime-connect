import { useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import {
  ArrowRight,
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
  Search,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { matchesQuery, normalizeForSearch } from '@/lib/search';
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
import fotoFondoEditorial1 from '@/assets/fondo editoria 1.webp';
import fotoFondoEditorial2 from '@/assets/fondo editoria 2.webp';

type Filter = 'todos' | CollectionId;

// Un icono por servicio, en el orden de FONDO_EDITORIAL.services.
const SERVICE_ICONS = [BookText, GraduationCap, BookOpen];

const COLLECTION_LABEL = new Map(COLLECTIONS.map((c) => [c.id, c.label]));

const COUNT_BY_COLLECTION = new Map(
  COLLECTIONS.map((c) => [c.id, CATALOG.filter((b) => b.collections.includes(c.id)).length])
);

// Índice de búsqueda (texto normalizado por libro), calculado una sola vez.
const SEARCH_INDEX = new Map(
  CATALOG.map((b) => [
    b.id,
    normalizeForSearch([b.title, b.author, b.illustrator, b.credits, b.synopsis].filter(Boolean).join(' ')),
  ])
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
          <p className="text-sm text-foreground/80">Ilustraciones de {book.illustrator}</p>
        )}
        {book.credits && <p className="text-xs text-foreground/80 mt-1">{book.credits}</p>}
        {book.synopsis && (
          <p className="text-sm text-foreground/80 mt-2 line-clamp-4">{book.synopsis}</p>
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
            className="inline-flex items-center text-sm text-foreground/80 hover:text-primary hover:underline"
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

  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleBooks = useMemo(
    () =>
      CATALOG.filter(
        (b) =>
          (filter === 'todos' || b.collections.includes(filter)) &&
          matchesQuery(SEARCH_INDEX.get(b.id) ?? '', query)
      ),
    [filter, query]
  );

  const clearQuery = () => {
    setQuery('');
    searchRef.current?.focus();
  };

  const resetSearch = () => {
    setQuery('');
    setFilter('todos');
  };

  const trimmedQuery = query.trim();

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
            {/* Título a la izquierda y los párrafos juntos a la derecha (mismo esquema que Contacto) */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-start mb-16 lg:mb-24">
              {/* Centrado en su espacio: a lo alto de la columna en escritorio, a lo ancho en móvil */}
              <h2 className="lg:col-span-4 lg:self-stretch flex flex-col items-center justify-center text-center text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">
                Quiénes <span className="block text-gradient">somos</span>
              </h2>
              <div className="lg:col-span-8 space-y-4 text-lg text-foreground/80 leading-relaxed">
                {FONDO_EDITORIAL.about.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            {/* Misión y visión intercaladas con fotos: [foto 1 | Misión] / [Visión | foto 2].
                Hasta lg se apilan en ese mismo orden. lg:self-stretch + w-full: con aspect-ratio la foto
                no se estira sola a la altura de la fila (y sin ancho fijo crecería a lo ancho). */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="aspect-[4/3] lg:aspect-[16/9] w-full lg:self-stretch overflow-hidden rounded-xl shadow-institutional">
                <img
                  src={fotoFondoEditorial1}
                  alt="Seis personas frente a la fachada del IBIME"
                  loading="lazy"
                  decoding="async"
                  // Recorte desplazado hacia abajo: el grupo está en la mitad inferior de la foto.
                  className="h-full w-full object-cover object-[50%_70%]"
                />
              </div>
              <div className="card-institutional lg:p-10 flex flex-col justify-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-2">Misión</h3>
                <p className="text-lg lg:text-xl text-foreground/80">{FONDO_EDITORIAL.mission}</p>
              </div>
              <div className="card-institutional lg:p-10 flex flex-col justify-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                  <Eye className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-2">Visión</h3>
                <p className="text-lg lg:text-xl text-foreground/80">{FONDO_EDITORIAL.vision}</p>
              </div>
              <div className="aspect-[4/3] lg:aspect-[16/9] w-full lg:self-stretch overflow-hidden rounded-xl shadow-institutional">
                <img
                  src={fotoFondoEditorial2}
                  alt="Actividad del Fondo Editorial: dos personas en una mesa con libros, junto a los pendones del Fondo Editorial Carmen Delia Bencomo y del IBIME"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Nuestro trabajo editorial */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-12">
              Nuestro <span className="text-gradient">Trabajo Editorial</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {FONDO_EDITORIAL.services.map((service, index) => {
                const Icon = SERVICE_ICONS[index] ?? BookText;
                return (
                  <div key={service.title} className="card-institutional">
                    <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-institutional flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">{service.title}</h3>
                    <p className="text-foreground/80">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Catálogo: scroll-mt-24 compensa la barra de navegación fija */}
        <section id="catalogo" className="py-20 section-pattern scroll-mt-24">
          <div className="container mx-auto px-4">
            {/* Título y descripción a la izquierda; el conteo, a la derecha en escritorio */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6 mb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Nuestro <span className="text-gradient">catálogo</span>
                </h2>
                <p className="text-foreground/80">
                  {CATALOG.length} libros disponibles para descargar en PDF desde el blog del Fondo Editorial.
                </p>
              </div>
              <p aria-live="polite" className="text-sm font-medium text-foreground/80 md:shrink-0">
                {visibleBooks.length === CATALOG.length
                  ? `Mostrando ${visibleBooks.length} libros`
                  : `Mostrando ${visibleBooks.length} de ${CATALOG.length} libros`}
              </p>
            </div>

            <div className="relative max-w-xl mb-4">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-accent pointer-events-none"
                aria-hidden="true"
              />
              {/* Borde de 2 px en el azul Acero para que el buscador se distinga en la sección */}
              <Input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar en el catálogo"
                placeholder="Buscar por título, autor o ilustrador…"
                className="h-12 pl-11 pr-11 text-base bg-card border-2 border-accent/60 shadow-sm hover:border-accent focus-visible:border-accent [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  aria-label="Borrar el texto de la búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-foreground/80 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div role="group" aria-label="Filtrar por colección" className="flex flex-wrap gap-2 mb-8">
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

            {visibleBooks.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-card p-6 text-left shadow-sm">
                <p className="text-foreground/80 mb-4">
                  {trimmedQuery
                    ? `No encontramos libros que coincidan con «${trimmedQuery}»${
                        filter !== 'todos' ? ' en esta colección' : ''
                      }`
                    : 'No encontramos libros para mostrar'}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={resetSearch}>
                  Limpiar búsqueda
                </Button>
              </div>
            ) : (
              <ul className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleBooks.map((book) => (
                  <li key={book.id}>
                    <BookCard book={book} />
                  </li>
                ))}
              </ul>
            )}
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
                <p className="text-lg font-medium text-foreground/80 mb-1">({CARMEN_DELIA_BENCOMO.lifespan})</p>
                <p className="text-foreground/80 mb-6">La autora que da nombre al Fondo</p>
                <div className="space-y-4 text-foreground/80 mb-6">
                  {CARMEN_DELIA_BENCOMO.summary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">Premios</h3>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80 mb-6">
                  {CARMEN_DELIA_BENCOMO.awards.map((award) => (
                    <li key={award}>{award}</li>
                  ))}
                </ul>
                <p className="text-foreground/80 mb-6">
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
                <p className="text-foreground/80 mb-4">{BIENAL.description}</p>
                <p className="text-foreground/80 mb-6">{BIENAL.winner}</p>
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

        {/* Contacto: banda de cierre con el degradado del hero */}
        <section className="py-20 bg-gradient-institutional text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-7">
                <span className="inline-block px-4 py-2 mb-6 text-sm font-medium rounded-full bg-white/10 text-white border border-white/30 backdrop-blur-sm">
                  Contacto
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-8">
                  {CONTACT.intro}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                    <a href={`mailto:${CONTACT.email}`}>
                      <Mail aria-hidden="true" />
                      Escríbenos
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/60 text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href={CONTACT.instagramUrl} {...EXTERNAL}>
                      <Instagram aria-hidden="true" />
                      Instagram
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/60 text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href={CONTACT.blogUrl} {...EXTERNAL}>
                      <BookText aria-hidden="true" />
                      Blog
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                  </Button>
                </div>
              </div>

              <ul className="lg:col-span-5 space-y-5 rounded-2xl border border-white/20 bg-white/10 p-6 md:p-8 backdrop-blur-sm text-white/90">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-white" aria-hidden="true" />
                  <span>{CONTACT.address}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5 shrink-0 text-white" aria-hidden="true" />
                  <a href={`mailto:${CONTACT.email}`} className="font-medium text-white hover:underline break-all">
                    {CONTACT.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 mt-0.5 shrink-0 text-white" aria-hidden="true" />
                  <a
                    href={CONTACT.blogUrl}
                    {...EXTERNAL}
                    className="inline-flex items-start gap-1 font-medium text-white hover:underline"
                  >
                    {CONTACT.subscribe}
                    <ArrowRight className="w-4 h-4 mt-1 shrink-0" aria-hidden="true" />
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default FondoEditorialPage;
