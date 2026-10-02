/**
 * frontend/src/data/fondo-editorial.ts
 *
 * Contenido de la página del Fondo Editorial Carmen Delia Bencomo.
 *
 * FUENTES (consultadas el 2026-09-30):
 * - Blog del Fondo, https://carmendeliabencomo.wordpress.com/ (vigente): catálogo,
 *   servicios, fundación, Carmen Delia Bencomo, Bienal y contacto. El catálogo
 *   son las entradas de su categoría "Catálogo" que tienen PDF alojado en el
 *   propio blog; las colecciones son sus categorías.
 * - Sitio anterior del IBIME, http://www.ibime.gob.ve/fondoeditorial/: misión y
 *   visión (el blog no las publica).
 *
 * Reglas al editar este archivo:
 * - No inventar textos. Las sinopsis son extractos de la ficha del libro en el
 *   blog; si la ficha no trae una, el campo se omite.
 * - Los PDF se enlazan al blog (no se copian: suman 149 MB).
 * - La portada de cada libro es `src/assets/fondo-editorial/<id>.webp`, generada
 *   con `scripts/portadas-fondo-editorial.mjs`. Un libro nuevo necesita su
 *   entrada en ese script.
 * - Carmen Delia Bencomo murió en La Guaira el 12/10/2002. El blog también da
 *   12-13/10/2003, pero el año lo descartan el Centro Nacional del Libro
 *   (cenal.gob.ve/?page_id=20155: "el 12 de octubre de 2002") y el "In
 *   memoriam" del Boletín de la Academia Nacional de la Historia (vol. 86,
 *   n.º 341, enero-marzo de 2003).
 */

export type CollectionId = 'infantil-juvenil' | 'biblioteca-cdb' | 'historia-patrimonio' | 'cimientos' | 'otras';

export type Collection = {
  readonly id: CollectionId;
  readonly label: string;
};

/** Colecciones en el orden en que se ofrecen como filtro. */
export const COLLECTIONS: readonly Collection[] = [
  { id: 'infantil-juvenil', label: 'Infantil y juvenil' },
  { id: 'biblioteca-cdb', label: 'Biblioteca Digital Carmen Delia Bencomo' },
  { id: 'historia-patrimonio', label: 'Historia y patrimonio' },
  { id: 'cimientos', label: 'Cimientos' },
  // Libros que el blog no asigna a ninguna colección.
  { id: 'otras', label: 'Otras publicaciones' },
];

export type Book = {
  /** Nombre del archivo de la portada en src/assets/fondo-editorial/. */
  readonly id: string;
  readonly title: string;
  /** Autoría tal como la firma la ficha; se omite en compilaciones sin autor. */
  readonly author?: string;
  readonly illustrator?: string;
  /** Otros créditos de la ficha: prólogo, estudio, compilación. */
  readonly credits?: string;
  readonly synopsis?: string;
  readonly collections: readonly CollectionId[];
  readonly pdfUrl: string;
  /** Versión para colorear, cuando el blog la ofrece. */
  readonly coloringPdfUrl?: string;
  /** Ficha del libro en el blog. */
  readonly postUrl: string;
};

/** Catálogo en el orden del blog: lo más reciente primero. */
export const CATALOG: readonly Book[] = [
  {
    id: 'el-ruisenor-y-la-estrella',
    title: 'El ruiseñor y la estrella',
    author: 'César Albornoz',
    illustrator: 'Luis José Pérez',
    synopsis:
      'Un cuento cargado de magia y amor por la naturaleza, escrito en tono poético donde el amor es el ingrediente transformador del ser.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2026/07/el-ruisenor-y-la-estrella-cesar-albornoz-1.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2026/07/06/el-ruisenor-y-la-estrella/',
  },
  {
    id: 'unidos-por-la-lectura',
    title: 'Unidos por la lectura. Plan de Lectura, Escritura y Oralidad 2026-2030',
    author: 'Ennio Tucci',
    synopsis:
      'El Plan de Lectura, Escritura y Oralidad Unidos por la Lectura (2026-2030), impulsado por el IBIME en el Estado Bolivariano de Mérida, busca transformar las Bibliotecas Públicas del Estado Bolivariano de Mérida en centros dinámicos para la innovación, la participación y justicia social para democratizar el acceso a la palabra como un derecho ciudadano fundamental.',
    collections: ['cimientos'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2026/05/unidos-por-la-lectura-plan-de-lectura-escritura-y-oralidad.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2026/05/11/unidos-por-la-lectura-plan-de-lectura-escritura-y-oralidad-2026-2030/',
  },
  {
    id: 'saberes-en-accion',
    title: 'Saberes en acción. La gestión bibliotecaria como motor de transformación',
    author: 'Vicky Figueroa, Jaymar Giraldo, Deiby Molero, Yasmely Altuve y Alchester Nieves',
    synopsis:
      'Saberes en acción. La gestión bibliotecaria como motor de transformación, es más que un compendio técnico sobre la administración de bibliotecas en el siglo XXI; es un testimonio de la transformación interna del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida (IBIME), desde la perspectiva de quienes dan vida a la institución.',
    collections: ['cimientos'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2026/03/saberes-en-accion.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2026/03/24/saberes-en-accion-la-gestion-bibliotecaria-como-motor-de-transformacion/',
  },
  {
    id: 'antidoto-explosivo',
    title: 'Antídoto explosivo y otros cuentos',
    author: 'Gonzalo Fragui',
    illustrator: 'Luis José Pérez',
    synopsis:
      'Antídoto explosivo y otros cuentos es una antología de cuentos cortos que divierten y llenan de alegría con ese toque pícaro y lleno de creatividad propio de los niños, relatan desde anécdotas con ese sentimiento cotidiano hasta historias fantasiosas, cada una construida con pinceladas poéticas y llenas de magia, cargadas de emoción y colores para invitarnos a reír y disfrutar con estos cortos cuentos.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2026/03/antidoto-explosivo-y-otros-cuentos.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2026/03/24/antidoto-explosivo-y-otros-cuentos/',
  },
  {
    id: 'las-campanas-magicas-de-don-gaspar',
    title: 'Las campanas mágicas de Don Gaspar',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Luis José Pérez',
    synopsis:
      'Las campanas mágicas de Don Gaspar es una historia que no sólo nos invita a ver lo mágico de las cosas más sencillas y cotidianas sino que nos recuerda que debemos valorar todo lo que nos rodea pues no sabemos cuando podría desaparecer.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2026/03/las-campanas-magicas-de-don-gaspar.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2026/03/24/las-campanas-magicas-de-don-gaspar/',
  },
  {
    id: 'las-semillas-magicas-de-ines',
    title: 'Las semillas mágicas de Inés. Antología para soñar y jugar con la lectura',
    author: 'Inés Vergara de Cuevas',
    credits: 'Prólogo de José Gregorio González Márquez. Estudio y compilación de Deimar Monsalve',
    synopsis:
      'Las semillas mágicas de Inés es una antología que celebra el legado de Inés Vergara de Cuevas, una escritora merideña cuya obra ha florecido en el corazón de la literatura infantil venezolana.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2025/05/las-semillas-magicas-de-ines.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2025/05/30/las-semillas-magicas-de-ines-antologia-para-sonar-y-jugar-con-la-lectura/',
  },
  {
    id: 'entre-sombras-y-musgo',
    title: 'Entre sombras y musgo. Antología poética',
    author: 'Clara Vivas Briceño',
    credits: 'Estudio y compilación de Mariana Quijano',
    synopsis:
      'La presente antología muestra breves retazos de algunas obras de Clara Vivas Briceño.',
    collections: ['historia-patrimonio'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2025/05/libro-clara-vivas.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2025/05/30/entre-sombras-y-musgo-antologia-poetica/',
  },
  {
    id: 'amaly-pregunta-sobre-el-cacao',
    title: 'Amaly pregunta sobre el cacao',
    author: 'Auckaiwary Cañas Díaz',
    synopsis:
      'Amaly está en la edad de las preguntas sobre el mundo y una taza de chocolate es el motivo de una larga conversación con su abuela sobre el cacao.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2025/04/amaly-pregunta-sobre-el-cacao-auckaiwary-canas-3.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2025/04/09/amaly-pregunta-sobre-el-cacao/',
  },
  {
    id: 'plan-leer-para-sonar',
    title: 'Plan de lectura Leer para soñar. Logros y retos 2022-2024',
    credits: 'Proyecto piloto del Plan Nacional de Lectura Manuel Vadell (Cenal-Ministerio del Poder Popular para la Cultura)',
    synopsis:
      'El motivo de esta publicación del Plan de lectura Leer para soñar, es comunicar los primeros logros obtenidos, objetivos y líneas de acción que se siguieron hasta ahora y que continúan durante el año 2025, de un proyecto que es esencial para el desarrollo humano del pueblo merideño y los servicios de bibliotecas e información del Estado Bolivariano de Mérida, como lo ha sido para otras ciudades del continente.',
    collections: ['cimientos'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2025/04/plan-de-lectura-leer-para-sonar-2022-2024.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2025/03/28/plan-de-lectura-leer-para-sonar-logros-y-retos-2022-2024/',
  },
  {
    id: 'las-curiosidades-de-buho',
    title: 'Las curiosidades de Búho',
    author: 'María Julia Rojas Rangel',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Desde las montañas de Mérida, Búho se despierta para perseguir una gran aventura en compañía de sus amigos. Un cuento que nos invita a soñar con llegar más lejos, cultivar la perseverancia y la creatividad como valores humanos necesarios para la vida, porque lo más importante es el viaje.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2025/01/las-curiosidades-de-buho-maria-julia-rojas-2.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2025/01/13/lolita-pequena-2/',
  },
  {
    id: 'lolita-pequena',
    title: 'Lolita pequeña',
    author: 'Sonia Jaramillo',
    illustrator: 'Ariadna Álvarez',
    synopsis:
      'Lolita está inconforme con su vida en la playa, hasta que un viejo cocotero le cuenta un secreto para valorar su vida. Una historia que nos reencuentra con el mar mientras nos enseña a combatir la frustración en nuestros niños y niñas, valorar lo que somos y vivir el presente como la única forma de llegar al futuro.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/11/lolita-pequena-sonia-jaramillo-1.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2024/11/25/lolita-pequena/',
  },
  {
    id: 'mi-bosque-sorprendido',
    title: 'Mi bosque sorprendido',
    author: 'Carmen Delia Bencomo',
    synopsis:
      'La poeta se toma la licencia de cantar al erotismo, donde el cuerpo es vehículo para el encuentro con el ser amado, y la palabra una partitura sobre una forma íntima de vivir el amor. Poesía que es manifiesto ético y estético para el vivir.',
    collections: ['biblioteca-cdb'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/10/mi-bosque-sorprendido-2.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2024/10/22/mi-bosque-sorprendido/',
  },
  {
    id: 'poemas-de-entrecasa',
    title: 'Poemas de entrecasa',
    author: 'Carmen Delia Bencomo',
    synopsis:
      'Con una poesía cuidadosa del lenguaje y atenta, Carmen Delia Bencomo nos regala esta mirada al mundo doméstico, el hogar, la casa y las diversas emociones que despiertan sus espacios.',
    collections: ['biblioteca-cdb'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/04/poemas-de-entrecasa-carmen-delia-bencomo.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2024/04/21/poemas-de-entrecasa/',
  },
  {
    id: 'solo-yo-conozco-tus-suenos',
    title: 'Solo yo conozco tus sueños',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Carmen Delia Bencomo nos regala un poema onírico donde la naturaleza se humaniza en la noche y se expresa con palabras cargadas de precisión y luz, cuyo espíritu es capturado por la artista Ludwianna Piñero Pereira para elaborar un libro álbum de exquisita belleza, dirigido a niños, niñas y amantes del arte.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/04/solo-yo-conozco-tus-suenos-pliegos.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2024/04/15/solo-yo-conozco-tus-suenos/',
  },
  {
    id: 'el-lenador-y-otras-obras',
    title: 'El leñador y otras obras. Tomo I',
    author: 'Pedro Maldonado Rojas',
    synopsis:
      'El leñador y otras obras es un libro de teatro para escolares, con obras que abordan temas educativos en las materias de historia, geografía, ciencias naturales y demás.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/04/el-lenador-y-otras-obras1-pedro-maldonado-rojas.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2024/04/15/el-lenador-y-otras-obras/',
  },
  {
    id: 'sortilegios',
    title: 'Sortilegios',
    author: 'Carmen Delia Bencomo',
    synopsis:
      'Sortilegios es una selección poética en la que es posible distinguir las diversas búsquedas existenciales de Carmen Delia Bencomo en el proceso de comunicar las preocupaciones de su mundo interior con el lector.',
    collections: ['biblioteca-cdb'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/11/sortilegios-carmen-delia-bencomo.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/11/27/sortilegios/',
  },
  {
    id: 'a-las-nubes-en-un-velero',
    title: 'A las nubes en un velero',
    author: 'César Luis Franco Rivero',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'A las nubes en un velero es un libro que todo venezolano, niño o adulto (no nos dejemos engañar por etiquetas), estará encantado de leer. Obra ganadora de la I Bienal de Literatura Infantil y Juvenil Carmen Delia Bencomo 2023.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/11/a-las-nubes-en-un-velero.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/11/27/a-las-nubes-en-un-velero/',
  },
  {
    id: 'cocuyos-de-cristal',
    title: 'Cocuyos de cristal',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Cocuyos de cristal es un libro que recoge relatos sobre las observaciones de los niños. Se compone de momentos que solo los niños pueden generar desde su diafanidad hacia las cosas, el mundo y la vida.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/07/cocuyos-de-cristal-carmen-delia-bencomo-cuento.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/07/12/cocuyos-de-cristal/',
  },
  {
    id: 'historia-basica-de-la-playa',
    title: 'Historia Básica de La Playa',
    author: 'Eufemiano Antonio Oballos y Pedro Andrés García Barillas',
    synopsis:
      'El fin común de esta Historia Básica de La Playa es destinar dicha obra al servicio de la comunidad playense a fin de que sirva a los habitantes de la Parroquia Gerónimo Maldonado como documento de identidad local.',
    collections: ['historia-patrimonio'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/06/historia-basica-de-la-playa.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/06/16/historia-basica-de-la-playa/',
  },
  {
    id: 'caja-de-poesia',
    title: 'Caja de poesía',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'La ternura es la bandera de este libro que se aproxima al lenguaje de los niños. Carmen Delia Bencomo dispone cantos y sencillas ornamentas al alcance de los niños y niñas, un juego que propone hacer a los bibliotecarios y docentes en forma de cajas de poesía abiertas al encuentro con los niños.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/06/caja-de-poesia-carmen-delia-bencomo-poesia.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/06/08/caja-de-poesia/',
  },
  {
    id: 'rostro-de-soledad',
    title: 'Rostro de soledad',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Desde una contemplación de sí misma, Carmen Delia Bencomo escudriña un rostro y recurre a la palabra para convocar la interioridad junto a su permanencia en las cosas, paisajes y voces.',
    collections: ['biblioteca-cdb'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/06/rostro-de-soledad-carmen-delia-bencomo-poesia.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/06/05/rostro-de-soledad/',
  },
  {
    id: 'los-cuentos-del-colibri',
    title: 'Los cuentos del colibrí',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Un colibrí nos cuenta sus historias de viaje por las tierras venezolanas y en su tránsito encuentra con lecciones de la mano de diversos animales. Un libro para despertar el amor por la naturaleza en los niños y niñas, publicado por el Consejo de Publicación de la ULA en 1984 y reeditado en esta ocasión en formato digital.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/04/los-cuentos-del-colibri-carmen-delia-bencomo-cuento.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/06/05/los-papagayos-teatro-para-ninos-2/',
  },
  {
    id: 'los-papagayos',
    title: 'Los papagayos. Teatro para niños',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Un año después de resultar ganadora en 1967 del Concurso de Teatro de Títeres, organizado en ese entonces, por la Dirección de Cultura de la Universidad Central de Venezuela, Caracas; “Los papagayos” da título al libro publicado por la Editorial Kapeluz, Caracas, 1968, donde se recogen seis obras de teatro dirigido a niños y niñas.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2024/01/los-papagayos.-teatro-para-ninos.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2023/03/30/los-papagayos-teatro-para-ninos/',
  },
  {
    id: 'tiempo-de-sombra',
    title: 'Tiempo de sombra',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Una mujer que vive el "boom" petrolero en una naciente ciudad de Venezuela, nos cuenta sus encuentros y desencuentros con el rol que la sociedad le exige. Una novela que transita los espacios del amor, el encuentro con la escritura, la agitación política de una época de la historia nacional y el despertar de una mujer que decide por sí misma su destino.',
    collections: ['biblioteca-cdb'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/12/tiempo-de-sombra-carmen-delia-bencomo-corregido-fm.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2022/12/16/tiempo-de-sombra/',
  },
  {
    id: 'cantaclaro-el-hijo-del-viento',
    title: 'Cantaclaro el hijo del viento',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'La imaginación se manifiesta cuando tratamos de explicar el por qué de la vida. En este juego de la imaginación, Carmen Delia nos ofrece una historia mágica donde los elementos de la naturaleza presencian el nacimiento de un nuevo ser, lleno de dones que despiertan sensaciones y sentires en quien lo rodea.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/12/tripa-cantaclaro-ilustrado2-fm.pdf',
    coloringPdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/12/tripa-cantaclaro-paracolorear-fm.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2022/12/06/cantaclaro-el-hijo-del-viento/',
  },
  {
    id: 'con-el-camino',
    title: 'Con el camino',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Una obra poética cargada de imágenes literarias que enriquecen la lectura ofreciendo más de una lectura, y que como menciona Carlos Augusto León en el prólogo: "el mundo poético de Carmen Delia todo tiene su parámetro en la luz, se mide con respecto y en relación con ella."',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/12/con-el-camino-carmen-delia-bencomo-poesia.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2022/12/06/con-el-camino/',
  },
  {
    id: 'diario-de-una-muneca',
    title: 'Diario de una muñeca',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Carmen Delia nos regala un Diario escrito por una muñeca alemana que llega a tierras merideñas donde consigue una madre y un hogar. La escritora tovareña se difumina en páginas hablando como Maruja, con voz filial, detonando emociones en cada línea y expresando lo profundo de su alma y sus deseos de ser amada.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/08/diario-de-una-muneca-carmendeliabencomo.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2022/08/12/diario-de-una-muneca/',
  },
  {
    id: 'el-oso-de-anteojos',
    title: 'El oso de anteojos',
    author: 'Elena Molina',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Un libro de poemas para leer a niños muy pequeños, cargados de amor por la naturaleza y los animales de Mérida-Venezuela.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/07/el-oso-de-anteojos.pdf',
    coloringPdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2023/03/el-oso-de-anteojos-colorear-1.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2022/07/02/el-oso-de-anteojos/',
  },
  {
    id: 'el-dia-que-gato-vendio-sus-guayos',
    title: 'El día que Gato vendió sus guayos',
    author: 'Jorge Ender Urbina Sosa',
    illustrator: 'Victoria Ysabella Urbina Peña',
    synopsis:
      'Una historia que presenta al deporte como una herramienta contra la drogadicción y rinde homenaje al reconocido entrenador Miguel Rivas "El Mono", quien dedicara su vida a la formación de generaciones de deportistas en la ciudad de Mérida.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2022/06/el-dicc81a-que-gato-vendiocc81-sus-guayos-pacc81ginas.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2022/07/02/el-dia-que-gato-vendio-sus-guayos/',
  },
  {
    id: 'cuentos-increibles-de-la-nona-maria',
    title: 'Cuentos increíbles de la Nona María',
    author: 'Gregoria Caraballo Guzmán',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Un libro que muestra algunas tradiciones e historias de la vida en los andes venezolanos en compañía de la Nona María.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/12/cuentos-increibles-de-la-nona-maria.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2021/12/15/cuentos-increibles-de-la-nona-maria/',
  },
  {
    id: 'balcones-del-agua',
    title: 'Balcones del agua. Antología poética de Carmen Delia Bencomo',
    author: 'Carmen Delia Bencomo',
    illustrator: 'Ludwianna Piñero Pereira',
    credits: 'Compilación de José Gregorio González Márquez',
    synopsis:
      'Carmen Delia Bencomo agudiza su sentido de escritura hasta lograr poemas verdaderamente maravillosos. No se queda en lo sencillo del verso; recorre senderos marcados para el deleite, la imagen pulimentada, la joya trabajada con esmero.',
    collections: ['biblioteca-cdb', 'infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/07/balcones-del-aguaantologia-cdb.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2021/08/19/balcones-del-agua-antologia-poetica-de-carmen-delia-bencomo/',
  },
  {
    id: 'las-letras-asustadas',
    title: 'Las letras asustadas y otros cuentos',
    author: 'María Luisa Lázzaro y Franklin Pérez Guillén Lázzaro',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Este libro surgió del acto de indagación de un niño de cuatro años, quien motivó a la vez a una abuela creativa a darle vida a varias historias, y de la mano de su nieto.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/07/las-letras-asustadas-maria-luisa-lazzaro.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2021/07/26/las-letras-asustadas-y-otros-cuentos/',
  },
  {
    id: 'en-las-nubes',
    title: 'En las nubes',
    author: 'Ana Isabel Sánchez Criollo',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Valentina se pregunta cómo sería vivir en las nubes mientras su tía procura responder a sus inquietudes y mostrarle alternativas para que haga realidad su sueño.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/05/en-las-nubes-ana-isabel-sanchez.pdf',
    coloringPdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/05/en-las-nubes-ana-isabel-sanchez-para-colorear.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2021/05/28/en-las-nubes-libro-para-colorear/',
  },
  {
    id: 'el-ascensor-magico',
    title: 'El ascensor mágico',
    author: 'Magda Uzcátegui Armas',
    illustrator: 'Ludwianna Piñero Pereira',
    synopsis:
      'Leo y su perro Brando encuentran por accidente un ascensor que lo lleva a distintas localidades de la ciudad de Mérida-Venezuela, donde experimentan el miedo que produce lo nuevo y conocen nuevos amigos.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/05/el_ascensor_macc81gico_liviano.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2021/05/28/el-ascensor-magico/',
  },
  {
    id: 'el-paramo-en-el-alma',
    title: 'El páramo en el alma. Relatos míticos e historias de vida de los habitantes de Gavidia',
    author: 'Henriette Arreaza Adam',
    collections: ['historia-patrimonio'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2021/05/el-paramo-en-el-alma-henriette-arreaza-3.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2021/05/28/el-paramo-en-el-alma/',
  },
  {
    id: 'el-verso-azul',
    title: 'El verso azul y la canción profana',
    author: 'Rubén Darío',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/verso-azul-rubc3a9n-darc3ado.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/11/el-verso-azul-y-la-cancion-profana/',
  },
  {
    id: 'modernismo-literario',
    title: 'Modernismo literario. Poesía selecta',
    credits: 'Compilación de Ángela Linares',
    synopsis:
      'Una selección de poesía modernista latinoamericana realizada por Ángela Linares.',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/modernismo-literario.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/11/modernismo-literario-poesia-selecta/',
  },
  {
    id: 'mar-revuelto',
    title: 'Mar revuelto',
    author: 'María Cristina Santana',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/mar-revuelto.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/11/mar-revuelto/',
  },
  {
    id: 'en-amarillo',
    title: 'En amarillo',
    author: 'Miguel Mata',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/en-amarillo.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/11/en-amarillo/',
  },
  {
    id: 'cuentos-rurales',
    title: 'Cuentos rurales',
    author: 'Ynmaculada Quintero',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/cuentos-rurales.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/11/cuentos-rurales/',
  },
  {
    id: 'canto-poetico',
    title: 'Canto poético',
    author: 'Nolberto Villarreal',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/canto-poc3a9tico.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/10/canto-poetico/',
  },
  {
    id: 'cantos-que-cuenta-la-luna',
    title: 'Cantos que cuenta la luna',
    author: 'Elena Molina',
    illustrator: 'Laura Medrano',
    synopsis:
      'Una selección de poemas para niños y niñas, escritos con la voluntad de propiciar un diálogo entre la infancia y la naturaleza.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/cantos-que-cuenta-la-luna.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2020/03/09/cantos-que-cuenta-la-luna/',
  },
  {
    id: 'palabras-para-la-infancia',
    title: 'Carmen Delia Bencomo: Palabras para la infancia',
    credits: 'Compilación de José Gregorio González',
    synopsis:
      'Una serie de ensayos sobre la obra de Carmen Delia Bencomo, realizados por un grupo de escritores venezolanos de destacada trayectoria. Palabras para la Infancia es así, una lectura del universo poético presente en la escritura de la autora merideña a quien hacemos homenaje.',
    collections: ['otras'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/4.palabrasparainfancia.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2019/12/11/carmen-delia-bencomo-palabras-para-la-infancia/',
  },
  {
    id: 'la-pequena-inventora',
    title: 'La pequeña inventora',
    author: 'Magda Uzcátegui',
    illustrator: 'Gisela Moy',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/3.lapequena-1.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2019/12/11/la-pequena-inventora/',
  },
  {
    id: 'filomena-en-busqueda-de-la-fotografia',
    title: 'Filomena en búsqueda de la fotografía',
    author: 'Luz del Mar Higuera',
    illustrator: 'Emil Otero',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2020/03/1.filomena.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2019/12/11/filomena-en-busqueda-de-la-fotografia/',
  },
  {
    id: 'raul-y-el-gran-mazafesio',
    title: 'Raúl y el Gran Mazafesio',
    author: 'Michelle Flores Perdomo',
    illustrator: 'Irene Rojas',
    synopsis:
      'Un ser mágico que se encarga de cuidar la naturaleza se encuentra con un niño y despierta su sensibilidad ecológica. Una fábula escrita desde la óptica infantil que nos ofrece una historia válida y significativa para acercar a los niños y niñas a la educación ambiental.',
    collections: ['infantil-juvenil'],
    pdfUrl: 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2016/06/raulyelgranmazafesio.pdf',
    postUrl: 'https://carmendeliabencomo.wordpress.com/2019/12/09/raul-y-el-gran-mazafesio/',
  },
];

export const FONDO_EDITORIAL = {
  name: 'Fondo Editorial Carmen Delia Bencomo',
  about: [
    'El Fondo Editorial Carmen Delia Bencomo se encarga de ejecutar la política editorial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida (IBIME), dirigida a difundir la identidad de la población merideña y contribuir al desarrollo nacional, estadal y local.',
    'Su objetivo es editar y publicar libros, revistas, folletos, desplegables y cualquier tipo de material biblio-hemerográfico y audiovisual sobre cultura y literatura merideña, con especial atención en la promoción de la lectura.',
    'Nace con la reforma de la Ley del Instituto Autónomo de Bibliotecas e Información del Estado Bolivariano de Mérida (2014) y se funda el 6 de julio de 2016 de la mano de escritores y personalidades de la región merideña, bajo la dirección de la Coordinación de la Red de Bibliotecas Públicas. Su primer libro fue Raúl y el Gran Mazafesio.',
  ],
  mission:
    'Desarrollar una producción editorial que difunda la identidad de la población merideña, con especial atención a la promoción de la lectura desde los espacios de los servicios de bibliotecas e información del Estado Bolivariano de Mérida.',
  vision:
    'Consolidarse como un proyecto editorial público de referencia para el Estado Bolivariano de Mérida y el país, por su calidad, transparencia y eficiencia tanto en la producción como en la promoción de la lectura.',
  services: [
    {
      title: 'Producción editorial',
      description:
        'Somos guardianes de nuestro patrimonio cultural escrito, por eso editamos libros con especial atención en la promoción de la lectura en el estado Mérida.',
    },
    {
      title: 'Formación',
      description:
        'Contribuimos a la formación de nuestras comunidades, especialmente en las áreas de escritura, formación editorial e ilustración.',
    },
    {
      title: 'Promoción de lectura',
      description:
        'Realizamos actividades de animación y acercamiento a la lectura para el beneficio de la comunidad en conjunto con las Bibliotecas Públicas del estado Mérida.',
    },
  ],
} as const;

export const CARMEN_DELIA_BENCOMO = {
  lifespan: 'Tovar, 1923 – La Guaira, 2002',
  summary: [
    'Nació en Tovar, estado Mérida, Venezuela, el 5 de julio de 1923. Poeta, narradora de cuentos y obras de teatro para niños y jóvenes, es una de las pioneras de la literatura infantil en Venezuela.',
    'Fue directora fundadora del Instituto Zuliano de Cultura y coordinadora de Cultura de la Gobernación del Estado Mérida. Colaboró en publicaciones como la Revista Shell, la Revista Nacional de Cultura, Tricolor y El tren de colores (Mérida, 1984-85).',
  ],
  awards: [
    'Primer Premio del Concurso de Cuentos Infantiles del Banco del Libro, con La cigarra niña (Caracas, 1965).',
    'Primer Premio de Teatro Infantil de la Dirección de Cultura de la UCV, con Los papagayos (Caracas, 1967).',
    'Segundo Premio del Concurso de Poesías Infantiles del Banco del Libro, con Cartilla del aire (Caracas, 1970).',
    'Primer Premio de Cuentos Infantiles de la Universidad de Carabobo, con Un cuento blanco para Mary (1983).',
  ],
  works:
    'Muñequitos de aserrín (1958), Cocuyos de cristal (1965), Los luceros cuentan niños (1967), Los papagayos (1968), Diario de una muñeca (1972), Los cuentos del colibrí (1984) y Cantaclaro (1997), entre otros.',
  profileUrl: 'https://carmendeliabencomo.wordpress.com/carmen-delia-bencomo/',
} as const;

export const BIENAL = {
  name: 'Bienal Nacional de Literatura Infantil y Juvenil Carmen Delia Bencomo',
  description:
    'Su primera edición convirtió a Mérida en el epicentro de la literatura nacional del 3 al 5 de julio de 2023, para conmemorar el centenario del natalicio de Carmen Delia Bencomo, referente indispensable de la literatura escrita para niños, niñas y jóvenes en el país.',
  winner: 'La obra ganadora, A las nubes en un velero, de César Luis Franco Rivero, forma parte de nuestro catálogo.',
  url: 'https://carmendeliabencomo.wordpress.com/2023/07/31/memoria-grafica-de-la-ia-bienal-nacional-de-literatura-carmen-delia-bencomo-merida-2023/',
} as const;

export const CONTACT = {
  /** Frase de la página de contacto del blog (con la coma que pide la oración). */
  intro: 'Si deseas hablarnos de un libro o actividad, no dudes en escribirnos.',
  /** Invitación del blog: "¡Suscríbete! Recibe nuestros libros en tu correo." */
  subscribe: 'Suscríbete en el blog y recibe nuestros libros en tu correo',
  address:
    'Sector Glorias Patrias, calle 01 Los Eucaliptos, entre avenidas Tulio Febres y Gonzalo Picón. Mérida, estado Mérida 5101, Venezuela.',
  email: 'fondoeditorialcdb@gmail.com',
  instagramUrl: 'https://www.instagram.com/editorialcdb/',
  instagramHandle: '@editorialcdb',
  blogUrl: 'https://carmendeliabencomo.wordpress.com/',
} as const;
