# 📘 Documentación Técnica Maestra: IBIME Connect

Este documento es la guía definitiva para entender, estudiar y defender la arquitectura y tecnología de **IBIME Connect**. Está diseñado para ser utilizado como base en entrevistas técnicas y para el mantenimiento profesional del sistema.

---

## 1. 📂 Visión General
**IBIME Connect** es una plataforma institucional diseñada para la modernización de la Red de Bibliotecas del Estado Mérida. No es solo una página web; es un ecosistema digital que integra Inteligencia Artificial avanzada (RAG), arquitectura limpia y procesos de automatización industrial (CI/CD).

### Problema Resuelto
- Desconexión informativa entre los ciudadanos y la base de conocimientos bibliotecaria.
- Necesidad de un asistente virtual que no "alucine" y proporcione datos reales de trámites, libros y eventos.

---

## 2. 🏛️ Arquitectura del Sistema: "Clean Architecture"

El sistema está construido bajo los principios de **Arquitectura Limpia (Hexagonal)** y **SOLID**. Esto permite que el núcleo del negocio sea independiente de las librerías o tecnologías externas.

### Capas del Proyecto
1.  **Backend (Node.js/Express/TypeScript)**:
    - **Controllers**: Validan la entrada y delegan la lógica a los servicios.
    - **Services**: Orquestan las reglas de negocio.
    - **Infrastructure**: Detalles técnicos como conexiones a base de datos y clientes de API de IA.
2.  **Frontend (React/Vite/TypeScript)**:
    - Sigue una arquitectura basada en componentes y hooks personalizados para separar el estado de la UI.
3.  **Shared (TypeScript)**:
    - El "Single Source of Truth". Contiene los tipos de datos y los esquemas de validación (Zod) que usan tanto el frontend como el backend. Esto evita errores de sincronización de datos.

### Inyección de Dependencias (DI)
Utilizamos `tsyringe` para gestionar dependencias. 
- **Por qué defender esto**: "Utilizamos DI para desacoplar las implementaciones de las interfaces. Por ejemplo, mi código pide un `ILLMProvider`. Hoy uso **Groq (Llama-3)**, pero si mañana quiero usar **OpenAI**, solo cambio una línea en el contenedor (`container.ts`) y el resto del sistema sigue funcionando impecable. Esto es escalabilidad real."

---

## 3. 🧠 Inteligencia Artificial Avanzada: RAG & Embeddings

El corazón del proyecto es el asistente inteligente institucional. No usamos GPT "tal cual", sino un motor **RAG (Retrieval-Augmented Generation)**.

### ¿Qué es un Embedding?
Es una representación matemática de un texto en un espacio vectorial. Convertimos frases en listas de números (vectores) que representan su **significado semántico**.
- **Herramienta**: Google Gemini (v1beta).
- **Detalle Técnico**: Forzamos la salida a **768 dimensiones** para ser compatibles con el estándar de `pgvector` en PostgreSQL.

### ¿Cómo funciona el RAG? (Flujo de Defensa)
1.  **Embed**: El usuario pregunta algo. Esa pregunta se convierte en un vector.
2.  **Retrieve (Recuperación) / Búsqueda Semántica**: Buscamos en nuestra base de datos vectorial (Supabase/PostgreSQL) los fragmentos de información más parecidos matemáticamente a la pregunta (Similitud de Coseno).
3.  **Augment (Aumentación)**: Inyectamos esos datos reales en el "cerebro" del asistente.
4.  **Generate**: El modelo (Llama-3.1 en Groq) responde basándose **solo** en esos datos.
- **Resultado**: El asistente no inventa información; si no está en el conocimiento oficial, admite que no lo sabe. Es una IA institucional confiable.

---

## 4. ⚡ Gestión de Datos y Rendimiento (Redis)

La IA es lenta y costosa. Por eso implementamos **Redis (Capa de Caché)**.
- **Caché de Embeddings**: Si mil personas preguntan lo mismo, solo pagamos y esperamos a la API una vez; las otras 999 veces Redis responde en nanosegundos (Caching a nivel de vectores).
- **Resiliencia**: Si Redis falla, el sistema detecta la caída y sigue operando directamente contra la base de datos sin crashear.

---

## 5. 🧪 Estrategia de Pruebas: Seguridad Industrial

Dividimos el testing para garantizar que ningún commit rompa el sistema:

### Unit Testing (Vitest)
Probamos las piezas pequeñas de lógica en aislamiento. Son ultra rápidos y aseguran que los servicios hagan su trabajo.

### E2E Testing (Playwright)
Un robot "abre" el navegador y hace clic en los botones simulando un usuario real. 
- **Aislamiento en CI/CD**: En GitHub, interceptamos las llamadas a la red (`page.route`) para simular respuestas exitosas. Esto nos permite probar la interfaz completa sin gastar dinero en APIs ni ensuciar la base de datos de producción con datos de prueba.

---

## 6. 🚀 CI/CD y DevOps (Pipelines)

Todo cambio subido al repositorio pasa por un control de calidad automático mediante **GitHub Actions**:
1.  **Linter**: Asegura estándares de código limpios.
2.  **Vite Build**: Verifica que el proyecto esté listo para producción.
3.  **Test Suite**: Ejecuta todos los tests automáticos.
- **Continuous Deployment**: Solo si todas las pruebas pasan, **Vercel** actualiza la plataforma en vivo. Esto garantiza que nunca se despliegue código roto.

---

## 7. 🛡️ Guía de Defensa para Reclutadores (Cheat Sheet)

| Pregunta del Reclutador | Tu Respuesta Ganadora |
| :--- | :--- |
| **¿Por qué Node.js y React?** | "Por el ecosistema robusto y la facilidad de compartir esquemas de Zod y tipos mediante un directorio compartido, garantizando integridad de datos completa." |
| **¿Cómo manejas la seguridad de IA?** | "Implementamos validación estricta de prompts en el servidor y usamos modelos de alto rendimiento con latencias ultra bajas para la mejor UX." |
| **¿Qué haces si la base de datos crece?** | "Usamos PostgreSQL con indexación HNSW para búsquedas vectoriales, lo que permite que el sistema maneje millones de documentos sin perder velocidad." |
| **¿Cómo aseguras la calidad del código?** | "Implementamos una pirámide de pruebas automatizadas y una arquitectura desacoplada que facilita el mantenimiento a largo plazo." |

---
*Este proyecto representa la convergencia entre la ingeniería de software clásica y la IA generativa de vanguardia.*
