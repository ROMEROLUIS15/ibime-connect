# Historial de Cambios (Changelog) 📜

Todos los cambios notables en este proyecto serán documentados en este archivo.

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
