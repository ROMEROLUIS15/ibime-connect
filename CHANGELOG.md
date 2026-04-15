# Historial de Cambios (Changelog) 📜

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [2.1.0] - 2026-04-15
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
