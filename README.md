# 🏛️ IBIME Connect — Plataforma Digital Institucional

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ibime-connect.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript)](https://www.typescriptlang.org/)

**IBIME Connect** es el ecosistema digital oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida (**IBIME**). Diseñado con una visión modernista y gubernamental, centraliza la interacción ciudadana, la gestión cultural y el acceso a la información pública mediante tecnologías de vanguardia.

🔗 **Acceso Público:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## 🌟 Funcionalidades Principales

### 🤖 Asistente Virtual Inteligente (IA RAG)
- **Implementación RAG (Retrieval-Augmented Generation):** Chatbot interactivo (Asistente Búho) que utiliza la API de **Google Gemini** para responder consultas contextualizadas con información institucional.
- **Búsqueda Semántica:** Integración de **PostgreSQL con `pgvector`** (vía Supabase) para el almacenamiento y recuperación de embeddings de conocimiento.
- **Seguridad Serverless:** Procesamiento de IA mediante **Supabase Edge Functions** (Deno), garantizando la protección de claves API y lógica de negocio en el backend.

### 🏛️ Gestión Institucional y Ciudadana
- **Portal Informativo:** Acceso detallado a la Misión, Visión, Valores y Reseña Histórica del instituto.
- **Eventos y Actividades:** Cartelera dinámica con registro integrado para eventos culturales y educativos.
- **Servicios Especializados:** Páginas dedicadas para el Catálogo Koha, Fondo Editorial y Libro Hablado.
- **Buzón de Contacto:** Sistema automatizado para la gestión de solicitudes y sugerencias ciudadanas.
- **Contador de Visitas:** Registro en tiempo real de la afluencia de usuarios al portal.

---

## 🎨 Diseño y Experiencia de Usuario (UX/UI)
- **Estética Institucional Premium:** Interfaz limpia y moderna utilizando **Glassmorphism**, gradientes institucionales y una paleta de colores acorde a la identidad del Estado Mérida.
- **Arquitectura Mobile-First:** Totalmente responsivo y optimizado para dispositivos móviles.
- **Componentes de Alto Nivel:** Uso de **Tailwind CSS**, **shadcn/ui** y primitivas de **Radix UI** para una interacción fluida y accesible.
- **Toques Dinámicos:** Animaciones suaves, carruseles de eventos táctiles y soporte nativo para **Modo Oscuro/Claro**.

---

## 🚀 Pila Tecnológica (Tech Stack)

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18, Vite (SWC), TypeScript |
| **Estilos & UI** | Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons |
| **Backend & BD** | Supabase (PostgreSQL), `pgvector` |
| **Lógica Serverless** | Supabase Edge Functions (Deno / TypeScript) |
| **IA & LLM** | Google Gemini API (Text & Embeddings) |
| **Estado & Consultas** | TanStack React Query |
| **Formularios** | React Hook Form, Zod |

---

## ⚙️ Configuración y Ejecución Local

Siga estos pasos para levantar el entorno de desarrollo en su máquina local:

### 1. Clonación e Instalación
```bash
git clone <URL_DEL_REPOSITORIO>
cd ibime-connect
npm install
```

### 2. Variables de Entorno
Cree un archivo `.env` en el directorio raíz basándose en el siguiente ejemplo:
```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"
VITE_OPENAI_API_KEY="opcional-si-aplica"
```

### 3. Ejecución del Proyecto
Inicie el servidor de desarrollo local:
```bash
npm run dev
```

> [!IMPORTANT]
> El proyecto está configurado para ejecutarse localmente en el puerto **4000**:
> **Acceso:** [http://localhost:4000](http://localhost:4000)

### 4. Despliegue de IA (Opcional)
Si requiere actualizar las funciones de IA en Supabase:
```bash
npx supabase secrets set GEMINI_API_KEY="tu_clave_de_gemini"
npx supabase functions deploy ibime-chat
npx supabase functions deploy ibime-ingest
```

---

## 🔒 Seguridad y Privacidad
Este proyecto implementa rigurosos estándares de seguridad institutional:
- **Row Level Security (RLS):** Control de acceso granular a nivel de base de datos para proteger la información del usuario.
- **Validación End-to-End:** Uso de **Zod** para la integridad de datos en formularios y comunicaciones API.
- **Backend Blindado:** Las interacciones sensibles (IA y Base de Datos) se ejecutan fuera del alcance del navegador, mitigando riesgos de inyección y exposición de claves.

---
© 2026 Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.  
*Impulsando el conocimiento y la cultura a través de la tecnología.*
