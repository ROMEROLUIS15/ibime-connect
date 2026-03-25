# 🏛️ IBIME Connect — Plataforma Institucional del Estado Mérida

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ibime-connect.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript)](https://www.typescriptlang.org/)

**IBIME Connect** es el ecosistema digital oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Mérida (**IBIME**). Esta plataforma centraliza la interacción ciudadana, la gestión cultural y el acceso a la información pública mediante tecnologías de última generación y una **Arquitectura Modular Serverless**.

🔗 **Acceso Público:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## 🌟 Logros Principales e Implemetaciones Clave (Reflejo Curricular)

Este proyecto resalta mi capacidad para construir aplicaciones Full-Stack modernas, integrando Inteligencia Artificial, Bases de Datos Vectoriales y Diseño de Interfaces Premium.

- **🤖 Asistente Virtual Inteligente con integración RAG (Retrieval-Augmented Generation):**
  - Desarrollo de un chatbot institucional interactivo disponible 24/7, protagonizado por un "Búho Robótico" (mascota hecha a la medida).
  - **Motor de IA:** Integración de la **API de Google Gemini** para la generación de respuestas en lenguaje natural contextualizadas con información pertinente a la institución.
  - **Base de Datos Vectorial:** Implementación en PostgreSQL extendida con **`pgvector`** (vía Supabase) para el almacenamiento de *embeddings* estructurados, habilitando capacidades de búsqueda semántica de alta fidelidad.
  - **Serverless Edge Functions:** Construcción y despliegue de módulos serverless mediante Supabase Edge Functions usando Deno (`ibime-chat`, `ibime-ingest`). Esto asegura el ocultamiento de las claves de la IA en todo momento y el escalado automático de los *endpoints*.

- **📊 Gestión Backend de Eventos y Contacto Comunitario:**
  - Diseño completo del esquema relacional en PostgreSQL (Supabase) para administrar los registros a eventos y manejar un buzón de contacto automatizado de manera concurrente.
  - Implementación de políticas y lineamientos de seguridad a nivel de base de datos **(Row Level Security - RLS)** para salvaguardar la privacidad de la información generada por el usuario.
  - Integración fluida front-to-back con **TanStack React Query**, posibilitando mutaciones ultra veloces (*optimistic UI updates*), invalidación de caché quirúrgica y validación de tipos cruzados en los formularios.

- **🎨 Arquitectura de UI/UX, Accesibilidad y Diseño Resolutivo:**
  - Construcción de una interfaz vibrante, fluida y con responsividad total (*Mobile-First*).
  - Empleo orgánico de conceptos estéticos avanzados modernos, entre ellos, **Glassmorphism**, brindando un efecto de capas visuales profundo.
  - Utilización experta de **Tailwind CSS** orquestado a componentes reutilizables sin cabeza altamente accesibles de **Radix UI** potenciados por el ecosistema **shadcn/ui**.
  - Especial atención a detalle: soporte integral con autoconmutaciones para *Dark / Light Mode*, restyling robusto y personalizado para notificaciones (*Toasts*), adaptación en vivo de *branding* institucional (Logo/Coloring) y rectificaciones minuciosas en carruseles y otros elementos interactivos.
  - Validaciones asíncronas en tiempo real provistas por **React Hook Form** amalgamado con **Zod** para integridad *End-to-End*.

---

## 🚀 Tecnologías y Stack de Desarrollo

El proyecto cuenta con una pila tecnológica *(Tech Stack)* moderna y fuertemente tipada:

| Categoría | Tecnología Utilizada |
| :--- | :--- |
| **Frontend Core** | React 18, Vite (SWC Loader), TypeScript (Strict Mode) |
| **Estilos & UI** | Tailwind CSS, shadcn/ui, Radix UI Primitives, Lucide Icons |
| **Manejo de Estado & Forms**| TanStack React Query, React Hook Form, Zod |
| **Backend & Base de Datos** | Supabase, PostgreSQL, `pgvector` (Vector DB) |
| **Funciones Serverless** | Supabase Edge Functions (Deno / TypeScript) |
| **IA & LLMs** | Google Gemini API (Text Generation & Embeddings) |
| **Autenticación** | Supabase Auth |
| **Despliegue** | Vercel (Front), Supabase Cloud (Postgres & Edge) |

---

## ⚙️ Configuración y Ejecución del Proyecto (Desarrollo Local)

Sigue estos pasos operativos para levantar el entorno de desarrollo local y empezar a trabajar:

### 1. Prerrequisitos de Entorno
- **Node.js**: Instalación de la versión v18 (LTS) o superior.
- Gestor de paquetes `npm` (o equivalente).
- Cuenta desarrollador habilitada en **Supabase** y **Google AI Studio**.

### 2. Instalación Integral
Inicia la configuración en terminal clonando y armando módulos:
```bash
git clone <URL_DEL_REPOSITORIO>
cd ibime-connect
npm install
```

### 3. Setup de Variables de Entorno (`.env`)
Configura un archivo oculto `.env` alojándolo en el directorio raíz. Estas variables mapean del lado del cliente hacia el backend; consecuentemente, **alerta**: por ningún motivo expongas *service roles keys* ni claves de APIs externas pagas aquí.

```env
VITE_SUPABASE_PROJECT_ID="tu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="tu_publishable_key"
VITE_SUPABASE_URL="https://tu_proyecto.supabase.co"
```

*Importante: La `GEMINI_API_KEY` necesaria para darle vida al Asistente IA RAG se configura rigurosa y excepcionalmente dentro del bóveda del entorno CLI de Supabase (Backend en la nube).*

### 4. Lanzamiento de Entorno de Desarrollo (HMR)
Inicia compilación en caliente para visualización en navegador:
```bash
npm run dev
```
La SPA (Single Page Application) estará accesible interactiva desde un host local: típicamente `http://localhost:5173`. Tiempos de renderizado son inmediatos por las cualidades de compilación esotéricas de Vite (SWC).

### 5. Configuración y Despliegue de IA (RAG con Supabase CLI) - Opcional
Comandos primarios para modificar parámetros en la Nube y despachar los controladores RAG en edge functions (si planeas actualizar prompts nativos del Asistente):

```bash
# Autenticarte en el Supabase CLI
npx supabase login

# Enlace al proyecto host de Supabase (identificador Ref)
npx supabase link --project-ref [TU_PROJECT_REF]

# Inyectar la llave criptográfica Gemini directo al Backend Secreto
npx supabase secrets set GEMINI_API_KEY="AI..."

# Despliegue continuo de los pipelines IA al Edge Node
npx supabase functions deploy ibime-chat
npx supabase functions deploy ibime-ingest
```

---

## 🔒 Privacidad, Propiedad y Seguridad Vectorial

Este repositorio es una estructura de nivel gubernamental con principios elementales mitigados en su arquitectura:

- **Contención y Privacidad Abstraída de IA:** El acceso primario al motor Gemini se canaliza exclusivamente mediante el Deno Runtime en Edge. Ni un solo *prompt engineering* crítico o llave foránea interinstitucional está visible en las herramientas de desarrollo (*DevTools*) corporativas ni desde el DOM web, resguardando todo el pipeline *Server-Side*.
- **Control Restricto (RLS):** Las consultas INSERT/SELECT hacia el modelo están rígidamente blindadas limitando accesos y dictaminando mutaciones exclusivas a usuarios validados (Auth), protegiendo en contra del abuso o sobrescritura indeseada de la memoria vectorial.

---
*Todos los derechos reservados © 2026. Desarrollo técnico operado para IBIME Mérida. Creado por un ingeniero amante de las soluciones Web eficientes y la IA.*
