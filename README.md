# 🏛️ IBIME Connect — Plataforma Institucional Inteligente del Estado Mérida

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ibime-connect.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript)](https://www.typescriptlang.org/)

**IBIME Connect** es el ecosistema digital oficial y modernizado del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida (**IBIME**). Esta plataforma representa un salto cualitativo hacia la digitalización institucional, centralizando el acceso a la cultura, la información ciudadana, los servicios bibliotecarios y el contacto directo con la comunidad mediante una experiencia de usuario (UX) premium y tecnologías Serverless de última generación.

🔗 **Acceso Público del Proyecto:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## ✨ Características y Módulos Implementados

Este proyecto integra múltiples módulos de nivel empresarial diseñados para brindar la mejor experiencia digital al ciudadano, destacando los siguientes hitos de ingeniería y diseño:

### 🤖 Asistente Virtual Inteligente (IA Institucional)
- **Chatbot con Arquitectura RAG (Retrieval-Augmented Generation):** Un asistente impulsado por IA disponible 24/7 (representado por el "Búho Robótico") capaz de responder consultas sobre requisitos, servicios e historia de la institución.
- **Integración de Google Gemini API:** Generación de respuestas naturales y precisas. 
- **Base de Datos Vectorial (`pgvector`):** Utilización de la base de datos PostgreSQL en Supabase para almacenar y buscar *embeddings* que otorgan el contexto institucional exacto a la IA.
- **Edge Functions (Deno):** Todo el procesamiento de IA (`ibime-chat` e `ibime-ingest`) se ejecuta de manera segura bajo funciones Serverless, garantizando que ninguna clave de IA sea expuesta en el Frontend.

### 🏛️ Ecosistema Institucional y de Servicios
- **Módulos de Identidad:** Secciones inmersivas de Misión, Visión, Valores y Reseña Histórica de la institución.
- **Páginas de Servicios Especializados:** Rutas dedicadas y enrutamiento SPA para los pilares del IBIME:
  - **Catálogo Koha:** Interfaz informativa sobre el sistema integrado de gestión bibliotecaria.
  - **Fondo Editorial:** Espacio dedicado a las publicaciones oficiales.
  - **Libro Hablado:** Servicio inclusivo para personas con discapacidad visual.

### 📰 Gestión de Contenidos Interactivas
- **Sección de Eventos (Carruseles):** Presentación dinámica de conferencias, talleres y actividades a través de componentes táctiles (`embla-carousel-react`).
- **Cartelera Informativa (Noticias):** Grilla optimizada para mostrar los comunicados de prensa y últimas novedades del Estado.
- **Galería interactiva:** Repositorio visual de la infraestructura y actividades culturales del IBIME.

### 🎨 Diseño Frontend Premium y Accesibilidad
- **Arquitectura UI de Alto Nivel:** Combinación de *Tailwind CSS*, *shadcn/ui* y primitivas accesibles de *Radix UI* para lograr una interfaz moderna, limpia y altamente receptiva (*Mobile-First*).
- **Estética Vanguardista:** Uso sutil de *Glassmorphism* (Efectos de vidrio esmerilado), gradientes institucionales y animaciones suaves para elevar la percepción de la marca gubernamental.
- **Métricas Comunitarias:** Sistema en tiempo real de **Contador de Visitas** integrado para registrar la afluencia de ciudadanos a la plataforma.
- **Modo Oscuro/Claro Inteligente:** Transición fluida y automática según las preferencias del visitante.

---

## 🚀 Arquitectura y Tech Stack

El código fue desarrollado siguiendo patrones de **Clean Architecture** en el cliente, modularizando componentes, utilidades y adaptadores, bajo un stack fuertemente tipado:

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite (SWC Loader), TypeScript (Strict Mode) |
| **Estilos y Componentes**| Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons |
| **Enrutamiento y Estado** | React Router DOM, TanStack React Query |
| **Formularios e Inputs** | React Hook Form, Zod (Validación de Esquemas) |
| **Backend as a Service** | Supabase (PostgreSQL, Row Level Security) |
| **Manejo Vectorial** | `pgvector` extensión para PostgreSQL |
| **Serverless Computing** | Supabase Edge Functions (Deno runtime) |
| **Inteligencia Artificial**| Google Gemini API (Text & Embeddings) |

---

## ⚙️ Guía de Ejecución Local

Sigue estas instrucciones para desplegar el entorno de desarrollo local y colaborar en la plataforma:

### 1. Requisitos Previos
- **Node.js** v18 LTS o superior.
- **npm** (v9+) o **bun** / **yarn**.
- CLI de Supabase (opcional para desarrollo local del backend).

### 2. Clonación e Instalación
```bash
git clone https://github.com/ROMEROLUIS15/ibime-connect.git
cd ibime-connect
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto tomando como referencia el `.env.example`. Llena las variables necesarias para conectar con el backend de Supabase:

```env
VITE_SUPABASE_URL="https://[TU_PROYECTO].supabase.co"
VITE_SUPABASE_ANON_KEY="tu_anon_key_publica"
```
*(No expongas la `GEMINI_API_KEY` ni el `SERVICE_ROLE_KEY` en el Frontend. Estas variables pertenecen exclusivamente a la caja fuerte de secretos del servidor).*

### 4. Modo Desarrollo
Inicia el servidor local impulsado por Vite:
```bash
npm run dev
```
La aplicación estará disponible de forma inmediata en `http://localhost:8080` (o el puerto indicado por consola), con recarga modular en caliente (HMR).

### 5. Compilación a Producción
Para exportar la versión minimizada y optimizada para la web:
```bash
npm run build
```

---

## 🔒 Privacidad y Seguridad

Como plataforma institucional, se implementaron medidas de resguardo estrictas:
- **Zero-Exposure en IA:** El cliente React jamás "toca" directamente la API de Google Gemini. Todo prompt, embedding y consulta RAG fluye internamente entre la Base de Datos Vectorial de Supabase y las Edge Functions, garantizando confidencialidad.
- **Row Level Security (RLS):** Las políticas de Postgres previenen inyecciones, accesos no autorizados a la telemetría e interacciones maliciosas sobre los eventos y correos de contacto.
- **Validación Front-to-Back:** Zod inspecciona estrictamente el esquema de cualquier información enviada por el ciudadano (e.g. Formularios de Contacto), repeliendo *cargas útiles* corruptas antes de contactar al servidor.

---

<div align="center">
  <small>Desarrollado y estructurado con altos estándares de calidad de software web.</small><br/>
  <small>© 2026 Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.</small>
</div>
