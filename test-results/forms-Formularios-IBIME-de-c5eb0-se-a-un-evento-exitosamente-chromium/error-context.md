# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: forms.spec.ts >> Formularios IBIME >> debe inscribirse a un evento exitosamente
- Location: e2e\forms.spec.ts:24:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/¡Inscripción exitosa!/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/¡Inscripción exitosa!/i)

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list [ref=e4]:
      - status [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: Datos inválidos
          - generic [ref=e8]: El nombre debe tener al menos 2 caracteres
        - button [ref=e9] [cursor=pointer]:
          - img [ref=e10]
  - region "Notifications alt+T"
  - generic [ref=e14]:
    - navigation [ref=e15]:
      - generic [ref=e17]:
        - link "IBIME" [ref=e18] [cursor=pointer]:
          - /url: /#inicio
          - img "IBIME" [ref=e19]
        - generic [ref=e21]:
          - link "Inicio" [ref=e23] [cursor=pointer]:
            - /url: "#inicio"
          - link "IBIME" [ref=e25] [cursor=pointer]:
            - /url: "#ibime"
          - link "Eventos" [ref=e27] [cursor=pointer]:
            - /url: "#eventos"
          - link "Fondo Editorial" [ref=e29] [cursor=pointer]:
            - /url: /fondo-editorial
          - link "Cartelera Informativa" [ref=e31] [cursor=pointer]:
            - /url: "#cartelera"
          - link "Servicios" [ref=e33] [cursor=pointer]:
            - /url: "#servicios"
          - link "Comunidad IBIME" [ref=e35] [cursor=pointer]:
            - /url: "#comunidad"
            - text: Comunidad IBIME
            - img [ref=e36]
          - link "Koha" [ref=e39] [cursor=pointer]:
            - /url: /koha
          - link "Libro Hablado" [ref=e41] [cursor=pointer]:
            - /url: /libro-hablado
          - link "Contacto" [ref=e43] [cursor=pointer]:
            - /url: "#contacto"
        - img "Gobernación de Mérida" [ref=e46]
    - main [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]:
          - img "Bienvenidos a IBIME" [ref=e51]
          - generic [ref=e53]:
            - generic [ref=e54]: Instituto de Bibliotecas e Información
            - heading "Bienvenidos a IBIME" [level=1] [ref=e55]
            - paragraph [ref=e56]: Educación, cultura y comunidad al servicio de todos los merideños
            - generic [ref=e57]:
              - button "Conocer más" [ref=e58] [cursor=pointer]
              - button "Nuestros Servicios" [ref=e59] [cursor=pointer]
        - generic [ref=e60]:
          - img "Espacios de Conocimiento" [ref=e62]
          - generic [ref=e64]:
            - generic [ref=e65]: Bibliotecas Modernas
            - heading "Espacios de Conocimiento" [level=1] [ref=e66]
            - paragraph [ref=e67]: Accede a miles de recursos educativos y culturales en nuestras bibliotecas
            - generic [ref=e68]:
              - button "Conocer más" [ref=e69] [cursor=pointer]
              - button "Nuestros Servicios" [ref=e70] [cursor=pointer]
        - generic [ref=e71]:
          - img "Cultura para Todos" [ref=e73]
          - generic [ref=e75]:
            - generic [ref=e76]: Eventos Comunitarios
            - heading "Cultura para Todos" [level=1] [ref=e77]
            - paragraph [ref=e78]: Participa en talleres, exposiciones y actividades culturales gratuitas
            - generic [ref=e79]:
              - button "Conocer más" [ref=e80] [cursor=pointer]
              - button "Nuestros Servicios" [ref=e81] [cursor=pointer]
        - button "Slide anterior" [ref=e82] [cursor=pointer]:
          - img [ref=e83]
        - button "Siguiente slide" [ref=e85] [cursor=pointer]:
          - img [ref=e86]
        - generic [ref=e88]:
          - button "Ir a slide 1" [ref=e89] [cursor=pointer]
          - button "Ir a slide 2" [ref=e90] [cursor=pointer]
          - button "Ir a slide 3" [ref=e91] [cursor=pointer]
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]: Sobre Nosotros
          - heading "¿Qué es IBIME?" [level=2] [ref=e96]
        - generic [ref=e101]:
          - generic [ref=e102]:
            - img [ref=e104]
            - img [ref=e109]
            - img [ref=e112]
            - img [ref=e118]
          - generic [ref=e121]:
            - heading "Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida" [level=3] [ref=e122]
            - paragraph [ref=e123]: Es el ente responsable de la ejecución de las políticas bibliotecarias y de información que se ofrecen a toda la comunidad merideña. Comprometidos con la educación, la cultura y el desarrollo integral de nuestra región, trabajamos cada día para acercar el conocimiento a todos los ciudadanos.
      - generic [ref=e131]:
        - generic [ref=e132]:
          - generic [ref=e133]: Identidad Institucional
          - heading "Nuestra Esencia" [level=2] [ref=e134]
          - paragraph [ref=e135]: Guiados por principios sólidos, trabajamos cada día para acercar el conocimiento y la cultura a todos los merideños.
        - generic [ref=e136]:
          - generic [ref=e137]:
            - img [ref=e139]
            - heading "Misión" [level=3] [ref=e143]
            - paragraph [ref=e144]: Ser el Ente del Gobierno Regional, responsable de la ejecución y cumplimiento de las políticas, normas y procedimientos, que en materia de Servicios de Bibliotecas e Información se ofrecen a toda la comunidad, sin hacer distinción de nacionalidad, credo, raza, sexo, nivel de formación y condición social, todo ello con el objeto de facilitar a toda la población el acceso universal a la información, de apoyar la investigación, la generación del conocimiento y la atención de las necesidades de información, conocimiento, educación, recreación y cultura, contribuyendo así a la formación de ciudadanos creativos, críticos, participativos y comprometidos con el desarrollo productivo del País.
          - generic [ref=e145]:
            - img [ref=e147]
            - heading "Visión" [level=3] [ref=e150]
            - paragraph [ref=e151]: Ser en el Estado Bolivariano de Mérida el organismo garante del principio de libertad de la población en general, principio éste traducido en la posibilidad de seleccionar materiales bibliográficos y no bibliográficos, en diferentes formatos, que constituyen el acervo histórico de la región, nacional y universal, para asegurarse así este derecho insoslayable establecido en la Constitución de la República Bolivariana de Venezuela, para de esta forma contribuir a la creatividad humana y a la formación de un ciudadano soberano, lector, crítico, selectivo, informado, libre y productivo como agente de desarrollo personal y cambio social.
          - generic [ref=e152]:
            - img [ref=e154]
            - heading "Valores" [level=3] [ref=e156]
            - paragraph [ref=e157]: Compromiso con la excelencia, inclusión social, respeto a la diversidad, transparencia en la gestión pública, innovación constante y pasión por el servicio a la comunidad merideña.
        - generic [ref=e158]:
          - generic [ref=e159]:
            - heading "Cifras Institucionales" [level=3] [ref=e160]
            - paragraph [ref=e161]: Nuestro alcance en el Estado Bolivariano de Mérida
          - generic [ref=e162]:
            - generic [ref=e163]:
              - img [ref=e165]
              - paragraph [ref=e167]: "60"
              - paragraph [ref=e168]: Bibliotecas
            - generic [ref=e169]:
              - img [ref=e171]
              - paragraph [ref=e176]: "521"
              - paragraph [ref=e177]: Personal
            - generic [ref=e178]:
              - img [ref=e180]
              - paragraph [ref=e182]: 160,000
              - paragraph [ref=e183]: Obras Disponibles
      - generic [ref=e185]:
        - generic [ref=e186]:
          - generic [ref=e187]:
            - generic [ref=e188]: Actualidad
            - heading "Cartelera Informativa" [level=2] [ref=e189]
          - button "Ver todas las noticias" [ref=e190] [cursor=pointer]:
            - text: Ver todas las noticias
            - img
        - article [ref=e191]:
          - generic [ref=e192]:
            - generic [ref=e193]:
              - img "Conformación del Congreso Nacional Constituyente Obrero" [ref=e194]
              - generic [ref=e195]: Destacado
            - generic [ref=e196]:
              - generic [ref=e197]:
                - img [ref=e198]
                - text: 14 Noviembre 2025
                - generic [ref=e200]: Institucional
              - heading "Conformación del Congreso Nacional Constituyente Obrero" [level=3] [ref=e201]
              - paragraph [ref=e202]: Cumpliendo con el llamado a la patria con la clase obrera, se llevó a cabo la convocatoria para la Conformación del Congreso Nacional Constituyente Obrero dentro del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, trabajadores y trabajadoras unidos participaron activamente y sin dilaciones en el proceso eleccionario de los Voceros y Voceras.
              - paragraph [ref=e203]: Este es un llamado a la renovación profunda de nuestras estructuras, basado en las 7 grandes transformaciones impulsadas por nuestro Presidente Obrero Nicolás Maduro y el Gobernador Arnaldo Sánchez.
              - link "Leer más" [ref=e204] [cursor=pointer]:
                - /url: "#"
                - text: Leer más
                - img [ref=e205]
        - generic [ref=e207]:
          - article [ref=e208]:
            - generic [ref=e209]:
              - img "Nueva colección de libros de historia regional" [ref=e210]
              - generic [ref=e211]: Cultura
            - generic [ref=e212]:
              - generic [ref=e213]:
                - img [ref=e214]
                - text: 10 Noviembre 2025
              - heading "Nueva colección de libros de historia regional" [level=3] [ref=e216]
              - paragraph [ref=e217]: Más de 300 nuevos títulos sobre historia y patrimonio cultural merideño se incorporan a nuestras bibliotecas.
              - link "Leer más" [ref=e218] [cursor=pointer]:
                - /url: "#"
                - text: Leer más
                - img [ref=e219]
          - article [ref=e221]:
            - generic [ref=e222]:
              - img "Talleres gratuitos de alfabetización digital" [ref=e223]
              - generic [ref=e224]: Educación
            - generic [ref=e225]:
              - generic [ref=e226]:
                - img [ref=e227]
                - text: 05 Noviembre 2025
              - heading "Talleres gratuitos de alfabetización digital" [level=3] [ref=e229]
              - paragraph [ref=e230]: Inscripciones abiertas para los talleres de computación básica dirigidos a adultos mayores.
              - link "Leer más" [ref=e231] [cursor=pointer]:
                - /url: "#"
                - text: Leer más
                - img [ref=e232]
          - article [ref=e234]:
            - generic [ref=e235]:
              - img "Programa de lectura para niños 2025" [ref=e236]
              - generic [ref=e237]: Comunidad
            - generic [ref=e238]:
              - generic [ref=e239]:
                - img [ref=e240]
                - text: 01 Noviembre 2025
              - heading "Programa de lectura para niños 2025" [level=3] [ref=e242]
              - paragraph [ref=e243]: Inicia el programa anual de fomento a la lectura con actividades especiales para los más pequeños.
              - link "Leer más" [ref=e244] [cursor=pointer]:
                - /url: "#"
                - text: Leer más
                - img [ref=e245]
      - generic [ref=e248]:
        - generic [ref=e249]:
          - generic [ref=e250]: Explora
          - heading "Galería Destacada" [level=2] [ref=e251]
        - generic [ref=e252]:
          - link "Contactos Contactos Encuentra la biblioteca más cercana" [ref=e253] [cursor=pointer]:
            - /url: "#"
            - img "Contactos" [ref=e254]
            - generic [ref=e257]:
              - heading "Contactos" [level=3] [ref=e258]
              - paragraph [ref=e259]: Encuentra la biblioteca más cercana
          - link "Espacios Espacios Conoce nuestras instalaciones modernas" [ref=e261] [cursor=pointer]:
            - /url: "#"
            - img "Espacios" [ref=e262]
            - generic [ref=e265]:
              - heading "Espacios" [level=3] [ref=e266]
              - paragraph [ref=e267]: Conoce nuestras instalaciones modernas
          - link "Actividades Actividades Participa en eventos culturales" [ref=e269] [cursor=pointer]:
            - /url: "#"
            - img "Actividades" [ref=e270]
            - generic [ref=e273]:
              - heading "Actividades" [level=3] [ref=e274]
              - paragraph [ref=e275]: Participa en eventos culturales
      - generic [ref=e277]:
        - generic [ref=e278]:
          - generic [ref=e279]:
            - generic [ref=e280]: Agenda Cultural
            - heading "Próximos Eventos" [level=2] [ref=e281]
          - generic [ref=e282]:
            - list "Carrusel de eventos" [ref=e284]:
              - listitem [ref=e285]:
                - generic [ref=e286]:
                  - img [ref=e288]
                  - generic [ref=e289]:
                    - heading "Festival del Libro 2026" [level=3] [ref=e290]
                    - generic [ref=e291]:
                      - img [ref=e292]
                      - generic [ref=e294]: 15-20 Febrero 2026
                    - generic [ref=e295]:
                      - img [ref=e296]
                      - generic [ref=e299]: Biblioteca Central
                    - paragraph [ref=e300]: Una semana dedicada a la literatura con autores invitados, talleres de escritura y presentaciones de libros.
                    - button "Inscribirse" [ref=e301] [cursor=pointer]
              - listitem [ref=e302]:
                - generic [ref=e303]:
                  - img "Cuentacuentos Infantil" [ref=e305]
                  - generic [ref=e306]:
                    - heading "Cuentacuentos Infantil" [level=3] [ref=e307]
                    - generic [ref=e308]:
                      - img [ref=e309]
                      - generic [ref=e311]: 8 Febrero 2026
                    - generic [ref=e312]:
                      - img [ref=e313]
                      - generic [ref=e316]: Todas las bibliotecas
                    - paragraph [ref=e317]: Sesiones de narración oral para niños de 3 a 10 años con actividades interactivas y manualidades.
                    - button "Inscribirse" [ref=e318] [cursor=pointer]
              - listitem [ref=e319]:
                - generic [ref=e320]:
                  - img [ref=e322]
                  - generic [ref=e323]:
                    - heading "Taller de Alfabetización Digital" [level=3] [ref=e324]
                    - generic [ref=e325]:
                      - img [ref=e326]
                      - generic [ref=e328]: 12 Febrero 2026
                    - generic [ref=e329]:
                      - img [ref=e330]
                      - generic [ref=e333]: Biblioteca Norte
                    - paragraph [ref=e334]: Aprende a usar computadoras, internet y herramientas digitales básicas. Cupos limitados.
                    - button "Inscribirse" [ref=e335] [cursor=pointer]
              - listitem [ref=e336]:
                - generic [ref=e337]:
                  - img [ref=e339]
                  - generic [ref=e340]:
                    - heading "Club de Lectura Mensual" [level=3] [ref=e341]
                    - generic [ref=e342]:
                      - img [ref=e343]
                      - generic [ref=e345]: 25 Febrero 2026
                    - generic [ref=e346]:
                      - img [ref=e347]
                      - generic [ref=e350]: Biblioteca Sur
                    - paragraph [ref=e351]: "Discusión del libro del mes: \"Cien años de soledad\" de Gabriel García Márquez."
                    - button "Inscribirse" [ref=e352] [cursor=pointer]
            - button "Evento anterior" [ref=e353] [cursor=pointer]:
              - img [ref=e354]
            - button "Siguiente evento" [ref=e356] [cursor=pointer]:
              - img [ref=e357]
            - tablist "Eventos" [ref=e359]:
              - 'tab "Ir al evento: Festival del Libro 2026" [ref=e360] [cursor=pointer]'
              - 'tab "Ir al evento: Cuentacuentos Infantil" [selected] [ref=e361] [cursor=pointer]'
              - 'tab "Ir al evento: Taller de Alfabetización Digital" [ref=e362] [cursor=pointer]'
              - 'tab "Ir al evento: Club de Lectura Mensual" [ref=e363] [cursor=pointer]'
        - dialog "Inscripción" [ref=e364]:
          - generic [ref=e366]:
            - button "Cerrar modal de inscripción" [ref=e367] [cursor=pointer]:
              - img [ref=e368]
            - heading "Inscripción" [level=3] [ref=e371]
            - paragraph [ref=e372]: Festival del Libro 2026 — 15-20 Febrero 2026
            - generic [ref=e373]:
              - generic [ref=e374]:
                - generic [ref=e375]: Nombre Completo *
                - textbox "Nombre Completo *" [ref=e376]
              - generic [ref=e377]:
                - generic [ref=e378]: Correo Electrónico *
                - textbox "Correo Electrónico *" [ref=e379]
              - generic [ref=e380]:
                - generic [ref=e381]: Teléfono *
                - textbox "Teléfono *" [ref=e382]:
                  - /placeholder: "Ej: 04121234567"
                  - text: 0412-555.55.55
              - button "Confirmar Inscripción" [active] [ref=e383] [cursor=pointer]
      - generic [ref=e385]:
        - generic [ref=e386]:
          - generic [ref=e387]: Red Bibliotecaria
          - heading "Servicios Bibliotecarios" [level=2] [ref=e388]
          - paragraph [ref=e389]: Nuestra red metropolitana de bibliotecas cubre todos los distritos de la ciudad, acercando el conocimiento a cada rincón de la comunidad.
        - generic [ref=e390]:
          - generic [ref=e391]:
            - generic [ref=e392]:
              - img [ref=e394]
              - img [ref=e397]
            - heading "Distrito Norte" [level=3] [ref=e400]
            - paragraph [ref=e401]: Biblioteca Metropolitana Norte
            - generic [ref=e402]:
              - generic [ref=e403]:
                - img [ref=e405]
                - generic [ref=e407]:
                  - paragraph [ref=e408]: "8"
                  - paragraph [ref=e409]: Bibliotecas
              - generic [ref=e410]:
                - img [ref=e412]
                - generic [ref=e414]:
                  - paragraph [ref=e415]: "12"
                  - paragraph [ref=e416]: Puntos de lectura
          - generic [ref=e417]:
            - generic [ref=e418]:
              - img [ref=e420]
              - img [ref=e423]
            - heading "Distrito Sur" [level=3] [ref=e426]
            - paragraph [ref=e427]: Biblioteca Metropolitana Sur
            - generic [ref=e428]:
              - generic [ref=e429]:
                - img [ref=e431]
                - generic [ref=e433]:
                  - paragraph [ref=e434]: "6"
                  - paragraph [ref=e435]: Bibliotecas
              - generic [ref=e436]:
                - img [ref=e438]
                - generic [ref=e440]:
                  - paragraph [ref=e441]: "15"
                  - paragraph [ref=e442]: Puntos de lectura
          - generic [ref=e443]:
            - generic [ref=e444]:
              - img [ref=e446]
              - img [ref=e449]
            - heading "Distrito Este" [level=3] [ref=e452]
            - paragraph [ref=e453]: Biblioteca Metropolitana Este
            - generic [ref=e454]:
              - generic [ref=e455]:
                - img [ref=e457]
                - generic [ref=e459]:
                  - paragraph [ref=e460]: "5"
                  - paragraph [ref=e461]: Bibliotecas
              - generic [ref=e462]:
                - img [ref=e464]
                - generic [ref=e466]:
                  - paragraph [ref=e467]: "8"
                  - paragraph [ref=e468]: Puntos de lectura
          - generic [ref=e469]:
            - generic [ref=e470]:
              - img [ref=e472]
              - img [ref=e475]
            - heading "Distrito Oeste" [level=3] [ref=e478]
            - paragraph [ref=e479]: Biblioteca Metropolitana Oeste
            - generic [ref=e480]:
              - generic [ref=e481]:
                - img [ref=e483]
                - generic [ref=e485]:
                  - paragraph [ref=e486]: "7"
                  - paragraph [ref=e487]: Bibliotecas
              - generic [ref=e488]:
                - img [ref=e490]
                - generic [ref=e492]:
                  - paragraph [ref=e493]: "10"
                  - paragraph [ref=e494]: Puntos de lectura
          - generic [ref=e495]:
            - generic [ref=e496]:
              - img [ref=e498]
              - img [ref=e501]
            - heading "Distrito Central" [level=3] [ref=e504]
            - paragraph [ref=e505]: Biblioteca Metropolitana Central
            - generic [ref=e506]:
              - generic [ref=e507]:
                - img [ref=e509]
                - generic [ref=e511]:
                  - paragraph [ref=e512]: "10"
                  - paragraph [ref=e513]: Bibliotecas
              - generic [ref=e514]:
                - img [ref=e516]
                - generic [ref=e518]:
                  - paragraph [ref=e519]: "20"
                  - paragraph [ref=e520]: Puntos de lectura
          - generic [ref=e521]:
            - generic [ref=e522]:
              - img [ref=e524]
              - img [ref=e527]
            - heading "Distrito Periférico" [level=3] [ref=e530]
            - paragraph [ref=e531]: Biblioteca Metropolitana Periférica
            - generic [ref=e532]:
              - generic [ref=e533]:
                - img [ref=e535]
                - generic [ref=e537]:
                  - paragraph [ref=e538]: "4"
                  - paragraph [ref=e539]: Bibliotecas
              - generic [ref=e540]:
                - img [ref=e542]
                - generic [ref=e544]:
                  - paragraph [ref=e545]: "6"
                  - paragraph [ref=e546]: Puntos de lectura
      - generic [ref=e549]:
        - img [ref=e551]
        - generic [ref=e556]:
          - paragraph [ref=e557]: 125,847
          - paragraph [ref=e558]: Visitantes a nuestro portal
      - generic [ref=e560]:
        - generic [ref=e561]:
          - button "Contáctanos" [ref=e562] [cursor=pointer]
          - heading "Estamos para Servirte" [level=2] [ref=e563]
          - paragraph [ref=e564]: ¿Tienes alguna pregunta o sugerencia? No dudes en comunicarte con nosotros.
        - generic [ref=e565]:
          - generic [ref=e566]:
            - generic [ref=e567]:
              - img [ref=e569]
              - generic [ref=e572]:
                - heading "Dirección" [level=3] [ref=e573]
                - paragraph [ref=e574]: Sector Glorias Patrias, Calle 1 Los Eucaliptos, entre Av. Gonzalo Picón y Tulio Febres
            - generic [ref=e575]:
              - img [ref=e577]
              - generic [ref=e580]:
                - heading "Horario de Atención" [level=3] [ref=e581]
                - paragraph [ref=e582]: De Lunes a Viernes 8:00 a.m a 12:00 p.m 1:00 p.m a 4:00 p.m
            - generic [ref=e583]:
              - img [ref=e585]
              - generic [ref=e587]:
                - heading "Teléfono" [level=3] [ref=e588]
                - paragraph [ref=e589]: 0274-2623898
            - generic [ref=e590]:
              - img [ref=e592]
              - generic [ref=e595]:
                - heading "Correo Electrónico" [level=3] [ref=e596]
                - paragraph [ref=e597]: ibimeinformatica@gmail.com
          - generic [ref=e598]:
            - heading "Envíanos un Mensaje" [level=3] [ref=e599]
            - generic [ref=e600]:
              - generic [ref=e601]:
                - generic [ref=e602]: Nombre Completo
                - textbox "Nombre Completo" [ref=e603]:
                  - /placeholder: Tu nombre
                  - text: Inscripción E2E
              - generic [ref=e604]:
                - generic [ref=e605]: Correo Electrónico
                - textbox "Correo Electrónico" [ref=e606]:
                  - /placeholder: tu@email.com
                  - text: e2e_events@test.com
              - generic [ref=e607]:
                - generic [ref=e608]: Mensaje
                - textbox "Mensaje" [ref=e609]:
                  - /placeholder: ¿En qué podemos ayudarte?
              - button "Enviar Mensaje" [ref=e610] [cursor=pointer]:
                - img
                - text: Enviar Mensaje
    - contentinfo [ref=e611]:
      - generic [ref=e613]:
        - generic [ref=e614]:
          - link "Logo IBIME IBIME Estado Bolivariano de Mérida" [ref=e615] [cursor=pointer]:
            - /url: "#inicio"
            - img "Logo IBIME" [ref=e617]
            - generic [ref=e618]:
              - text: IBIME
              - generic [ref=e619]: Estado Bolivariano de Mérida
          - paragraph [ref=e620]: Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida. Comprometidos con la educación, la cultura y el desarrollo de nuestra comunidad.
          - generic [ref=e621]:
            - link "Twitter / X" [ref=e622] [cursor=pointer]:
              - /url: https://x.com/IBIMEGOB
              - img [ref=e623]
            - link "Facebook" [ref=e625] [cursor=pointer]:
              - /url: https://www.facebook.com/ibimegob
              - img [ref=e626]
            - link "Instagram" [ref=e628] [cursor=pointer]:
              - /url: https://www.instagram.com/ibimegob?igsh=bTBoN3JrNHRsaDBk
              - img [ref=e629]
            - link "YouTube" [ref=e632] [cursor=pointer]:
              - /url: https://www.youtube.com/@ibime1800
              - img [ref=e633]
        - generic [ref=e636]:
          - heading "Enlaces Rápidos" [level=3] [ref=e637]
          - list [ref=e638]:
            - listitem [ref=e639]:
              - link "IBIME" [ref=e640] [cursor=pointer]:
                - /url: "#ibime"
            - listitem [ref=e641]:
              - link "Eventos" [ref=e642] [cursor=pointer]:
                - /url: "#eventos"
            - listitem [ref=e643]:
              - link "Servicios" [ref=e644] [cursor=pointer]:
                - /url: "#servicios"
            - listitem [ref=e645]:
              - link "Cartelera" [ref=e646] [cursor=pointer]:
                - /url: "#cartelera"
        - generic [ref=e647]:
          - heading "Ubicación" [level=3] [ref=e648]
          - link "Google Maps IBIME" [ref=e649] [cursor=pointer]:
            - /url: https://www.google.com/maps/search/?api=1&query=Sector+Glorias+Patrias,+Calle+1+Los+Eucaliptos,+entre+Av+Gonzalo+Picon+y+Tulio+Febres,+Merida+Venezuela
            - iframe [ref=e651]:
              - link "Abrir en Maps (se abre en una nueva pestaña)" [ref=f1e4] [cursor=pointer]:
                - /url: undefined
                - text: Abrir en Maps
                - img [ref=f1e6]
        - generic [ref=e652]:
          - heading "Datos Institucionales" [level=3] [ref=e653]
          - generic [ref=e654]:
            - generic [ref=e655]:
              - img [ref=e656]
              - generic [ref=e659]: Sector Glorias Patrias, Calle 1 Los Eucaliptos, entre Av. Gonzalo Picón y Tulio Febres
            - generic [ref=e660]:
              - img [ref=e661]
              - generic [ref=e663]: 0274-2623898
            - generic [ref=e664]:
              - img [ref=e665]
              - link "contactoibime@gmail.com" [ref=e668] [cursor=pointer]:
                - /url: mailto:contactoibime@gmail.com
      - generic [ref=e671]:
        - paragraph [ref=e672]: © 2026 IBIME. Todos los derechos reservados.
        - generic [ref=e673]:
          - link "Políticas de Privacidad" [ref=e674] [cursor=pointer]:
            - /url: "#"
          - link "Términos de Uso" [ref=e675] [cursor=pointer]:
            - /url: "#"
  - generic [ref=e677]:
    - generic: Asistente IA
    - button "Abrir Asistente IA del IBIME" [ref=e678] [cursor=pointer]:
      - img "Asistente IA" [ref=e679]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Formularios IBIME', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('debe enviar el formulario de contacto exitosamente', async ({ page }) => {
  9  |     // Scroll hasta la sección de contacto
  10 |     await page.locator('#contacto').scrollIntoViewIfNeeded();
  11 | 
  12 |     // Llenar campos
  13 |     await page.getByLabel(/Nombre Completo/i).first().fill('Test E2E');
  14 |     await page.getByLabel(/Correo Electrónico/i).first().fill('e2e@test.com');
  15 |     await page.getByLabel(/Mensaje/i).fill('Este es un mensaje automático de prueba E2E.');
  16 | 
  17 |     // Click en enviar
  18 |     await page.getByRole('button', { name: /Enviar Mensaje/i }).click();
  19 | 
  20 |     // Verificar notificación de éxito
  21 |     await expect(page.getByText(/¡Mensaje enviado!/i)).toBeVisible();
  22 |   });
  23 | 
  24 |   test('debe inscribirse a un evento exitosamente', async ({ page }) => {
  25 |     // Scroll hasta la sección de eventos
  26 |     await page.locator('#eventos').scrollIntoViewIfNeeded();
  27 | 
  28 |     // Click en el primer botón de inscribirse
  29 |     await page.getByRole('button', { name: /Inscribirse/i }).first().click();
  30 | 
  31 |     // Llenar modal
  32 |     await page.getByLabel(/Nombre Completo/i).last().fill('Inscripción E2E');
  33 |     await page.getByLabel(/Correo Electrónico/i).last().fill('e2e_events@test.com');
  34 |     await page.getByLabel(/Teléfono/i).fill('0412-555.55.55');
  35 | 
  36 |     // Confirmar
  37 |     await page.getByRole('button', { name: /Confirmar Inscripción/i }).click();
  38 | 
  39 |     // Verificar éxito
> 40 |     await expect(page.getByText(/¡Inscripción exitosa!/i)).toBeVisible();
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  41 |   });
  42 | });
  43 | 
```