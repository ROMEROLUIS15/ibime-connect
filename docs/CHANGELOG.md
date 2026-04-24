# Historial de Cambios (Changelog) 📜

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [2.3.0] - 2026-04-24
### 🧠 Pipeline Empresarial de Ingesta RAG (Conocimiento Institucional)

Esta actualización dota a la plataforma de una arquitectura profesional para la ingesta, procesamiento y vectorización de conocimiento institucional (PDFs) y catálogos dinámicos (Koha), permitiendo que la Inteligencia Artificial responda sin alucinaciones basándose en una base de datos vectorial real.

#### ✨ Nuevo
- **Endpoints de Ingesta (`/api/v1/knowledge`)**: 
  - `POST /upload-pdf`: Procesamiento de archivos PDF en memoria (sin tocar el disco duro, optimizado para plataformas efímeras como Render).
  - `POST /webhook/koha`: Webhook diseñado para recibir JSON arrays generados por automatizaciones en n8n (ej. exportaciones diarias del catálogo Koha).
- **Procesamiento de Documentos (`DocumentProcessorService.ts`)**: Implementación de algoritmos de *Chunking Inteligente* utilizando `pdf-parse`, dividiendo textos largos en fragmentos de 1000 caracteres con 200 caracteres de solapamiento semántico (overlap) para no perder el contexto entre párrafos.
- **Servicio de Vectorización (`KnowledgeIngestionService.ts`)**: Conexión directa con la API de embeddings de Gemini (768 dimensiones) e inserción automatizada en la base de datos `knowledge_base` en Supabase, utilizando el campo JSON `metadata` para clasificar categorías dinámicamente.
- **Single Source of Truth (`system-prompt.ts`)**: Separación estricta de responsabilidades. La identidad núcleo y estática (Directora actual, horarios) vive en RAM mediante el prompt, mientras que el conocimiento extenso (Historia, Reglamentos, Catálogo) vive en la base de datos vectorial.

---

### 🎬 Integración de Videoteca Cultural con Cloudinary

Esta versión introduce una nueva sección en la plataforma web dedicada a preservar y difundir el patrimonio histórico-cultural del Estado Mérida mediante contenido audiovisual optimizado.

#### ✨ Nuevo
- **Sección de Cápsulas Culturales (`CulturalVideosSection.tsx`)**: Nueva área en la landing page principal para la reproducción de videos institucionales (Escritores Merideños, Heroínas de Venezuela).
- **Integración con Cloudinary**: Se incorporó Cloudinary como CDN para el streaming de videos (en lugar de almacenamiento en base de datos) utilizando transformaciones `q_auto` y `f_auto` para un rendimiento máximo.
- **Capa de Utilidades SoC (`lib/cloudinary.ts`)**: Extracción de las funciones generadoras de URLs (para streaming de video y extracción automática de fotogramas clave/portadas vía `so_auto`) garantizando el principio *Separation of Concerns*.
- **Diseño**: La nueva sección hereda el lenguaje visual institucional y los videos usan la API HTML5 nativa, manteniendo la interfaz limpia de logos de terceros (como YouTube/Vimeo).

#### 🔧 Mejoras de Interfaz (UI)
- **Footer (`Footer.tsx`)**: Se reajustaron las proporciones del iframe de Google Maps integrado, mejorando el balance visual con las otras columnas institucionales.

---

## [2.2.0] - 2026-04-16
### 🛡️ Pre-Commit Quality Gate — Husky v9 + lint-staged + ESLint

Esta versión implementa el sistema completo de calidad de código automatizada en la raíz del proyecto.

#### ✨ Nuevo
- **Hook `pre-commit`** (Husky v9): ejecuta `lint-staged` con ESLint `--fix` sobre archivos `*.{js,jsx,ts,tsx}` en staging. Solo se lint-ea lo que se va a commitear.
- **Hook `pre-push` — Quality Gate**: 3 etapas secuenciales (ESLint → TypeScript → Vitest). Si cualquier etapa falla, el push es cancelado con diagnóstico detallado y sugerencias de corrección inteligentes por tipo de error.
- **Scripts en `package.json` raíz**: `lint`, `typecheck`, `test` y `prepare` — delegan a los scripts del frontend para una experiencia de desarrollo unificada.
- **Script `typecheck` en `frontend/package.json`**: `tsc --noEmit` — requerido por el hook pre-push.
- **`CODE_QUALITY.md`**: documentación técnica completa del sistema (hooks, ESLint config, flujo de desarrollador, notas de formato Husky v8 vs v9).

#### 📝 Documentación
- `README.md`: añadidos badges Husky/lint-staged, fila de Calidad de Código en la tabla de stack, tabla de scripts del proyecto, sección completa del Quality Gate, y `CODE_QUALITY.md` en la tabla de documentación adicional.
- `CONTRIBUTING.md`: sección de Sistema de Calidad Automática con descripción de ambos hooks y comando `--no-verify` para casos excepcionales.

---


### 🛡️ Arquitectura Determinista de Seguridad — Auditoría y Consolidación

Esta versión consolida el sistema de control de output del LLM, cierra brechas de seguridad críticas identificadas en auditoría y actualiza toda la documentación técnica.

#### 🔴 Bugs Críticos Resueltos
- **`finalizeResponse` runtime error**: Método llamado en el flow de registro sin email que no existía en la clase `ChatOrchestrator`. Causa de crash en producción en ese path específico.
- **`applyResponsePolicy` código muerto**: La función estaba importada en `ChatOrchestrator` pero nunca era invocada. El sistema usaba un método privado `applyGuardrail()` que llamaba directamente a `checkResponseGuardrail()` omitiendo completamente la capa de Policy (validación de longitud, fallbacks por intent).

#### 🛡️ Mejoras de Seguridad
- **`ResponsePolicy` integrada como única fuerta final**: Todo output LLM ahora pasa por `applyResponsePolicy()`. El LLM nunca es la última capa.
- **Defensa contra bypass del whitelist de registration**: Cuando `isDbBacked=false`, el guardrail se invoca en modo `general` aunque el intent sea `registration`, impidiendo que el whitelist del flow registration pueda ser explotado sin datos reales de DB.
- **System prompt hardened**: Reglas 2-4 redundantes consolidadas en una regla precisa. Fallback hardcoded eliminado del prompt (propiedad exclusiva de ResponsePolicy). Defensa explícita contra prompt injection via contenido RAG.

#### 🧪 Calidad y Testing
- **`response-policy.test.ts` (nuevo, 25 tests)**: Cobertura completa de la única capa que no tenía tests unitarios propios: validación estructural, blocking de alucinaciones, bypass isDbBacked, fallbacks por intent.
- **Total tests**: 175 (150 previos + 25 nuevos) — 100% passing.
- **vitest `^4.1.3` → `^2.1.9`**: Downgrade necesario para compatibilidad con Node.js 18 LTS (vitest 4.x requiere Node ≥ 20.12.0 por dependencia de `rolldown`).

#### 📝 Documentación
- `ARCHITECTURE.md`: Reescrito con diagrama Mermaid del flujo real de decisión + tabla de capas de seguridad.
- `AI_STRATEGY.md`: Corregidos valores incorrectos (threshold `0.4→0.65`, temperatura `0.6→0.2/0.3`, maxTokens `800→400/600`). Añadida descripción de las cuatro capas de defensa.
- `TECHNICAL_DOCUMENTATION.md`: Actualizadas respuestas de defensa para reclutadores con los detalles del sistema determinista.
- `README.md`: Badge de Node.js corregido (`20+` → `18+ LTS`).

---

## [2.0.0] - 2026-04-09
### 🔥 Refactorización Arquitectónica y Optimización de IA

Esta versión marca un hito en la evolución técnica del proyecto, migrando de una lógica serverless simple a un backend robusto y escalable.

#### ✨ Características Principales
- **Migración a Node.js/Express**: Centralización de la lógica de negocio en un backend robusto con TypeScript.
- **Inyección de Dependencias**: Implementación de `tsyringe` para un diseño desacoplado y mantenible.
- **Caché con Redis**: Integración de una capa de caché para embeddings y contextos RAG, reduciendo latencia y costos operativos.
- **Logs Estructurados**: Implementación de **Pino** con correlación de peticiones vía `X-Request-ID`.
- **API Versioning**: Introducción de rutas versionadas bajo `/api/v1/` manteniendo retrocompatibilidad.

#### 🧪 Calidad y Testing
- Configuración de **Vitest** como motor de pruebas oficial.
- Implementación de Unit Tests para servicios core (`Chat`, `RAG`, `Embedding`).
- Reportes de cobertura habilitados (>90% en lógica crítica).

#### 🛡️ Seguridad
- Implementación de **Rate Limiting** dinámico por endpoint.
- Validación de datos estricta con **Zod** en el backend y frontend.

---

## [1.0.0] - Versión Inicial
### 🏛️ Lanzamiento de la Plataforma Institucional

- Portal informativo oficial del IBIME.
- Asistente virtual básico usando Supabase Edge Functions.
- Registro de cursos y formulario de contacto integrados con Supabase.
- Diseño visual basado en Tailwind CSS y shadcn/ui.

---
*Para ver los detalles de commits anteriores, consulta el historial de Git.*
