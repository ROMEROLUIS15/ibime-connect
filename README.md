# 🏛️ IBIME Connect — Plataforma Institucional del Estado Mérida

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ibime-connect.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)

**IBIME Connect** es el ecosistema digital oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Mérida (**IBIME**). Esta plataforma centraliza la interacción ciudadana, la gestión cultural y el acceso a la información pública mediante tecnologías de última generación.

🔗 **Acceso Público:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## 🛠️ Capacidades Tecnológicas Destacadas

- **🤖 Inteligencia Artificial y Chatbot:** Asistente virtual institucional (Búho Robótico) conectado a modelos de LLM (Gemini) vía Supabase Edge Functions. Posee memoria de contexto para atención directa 24/7 al ciudadano.
- **📂 Memoria Vectorial Avanzada:** Base de datos inteligente utilizando **pgvector** en PostgreSQL para permitir indexación semántica y búsquedas por conocimiento institucional complejo.
- **📩 Infraestructura de Contacto y Eventos:** Sistema robusto para el registro en eventos comunitarios y canalización de dudas. Gestión de datos almacenada de forma segura en **Supabase**.
- **✨ Diseño UI/UX Institucional:** Interfaz premium moderna aplicando técnicas de **Glassmorphism**, menús responsivos inteligentes y lectura consciente del contraste (Dark/Light detection dinámico). Adaptada 100% a la identidad visual de la Gobernación de Mérida.
- **🌐 Integración Bibliotecaria Integrada:** Accesos directos y flujos a plataformas vitales de lectura (Catálogo Koha, Libro Hablado, Fondo Editorial).

---

## 🚀 Stack de Desarrollo

El proyecto utiliza un *stack* moderno, escalable y fuertemente tipado:

| Componente | Tecnología |
| :--- | :--- |
| **Frontend** | React 18 + Vite (SWC Loader) |
| **Backend / DB** | Supabase (PostgreSQL), Edge Functions (Deno) |
| **Lenguaje** | TypeScript (Strict Mode) |
| **Estilos & UI** | Tailwind CSS + shadcn/ui + Radix UI Primitives |
| **Data Fetching**| TanStack React Query + Zod (Validaciones) |

---

## 🔒 Propiedad e Integridad

Este repositorio contiene código fuente **privado y exclusivo** de la institución.

- **Acceso Restringido:** El desarrollo de arquitectura, refactorización y mantenimiento está a cargo únicamente del equipo técnico autorizado (incluyendo flujos CI/CD).
- **Seguridad:** Implementa protección segura de variables de entorno mediante `.env`, Edge Functions privadas (ocultando API Keys reales de IA), y políticas **RLS (Row Level Security)** que blindan la tabla de datos pública.
- **Licencia:** Todos los derechos reservados © 2026 **IBIME**. Queda estrictamente prohibida la copia, reproducción o distribución total o parcial de las funciones, del "Asistente IA", o de partes de este código sin autorización escrita y previa de la directiva de la Institución.

---

## ⚙️ Ejecución en Entorno de Desarrollo

*Este apartado técnico es exclusivo para administradores de sistemas locales e ingenieros backend en entornos POSIX / Windows:*

1. **Instalación de Dependencias:**  
   ```bash
   npm install
   ```
2. **Setup de Variables de Entorno:**
   Configurar archivo `.env` en la raíz (estricto) con credenciales de los servicios:
   ```env
   VITE_SUPABASE_PROJECT_ID="tu_project_id"
   VITE_SUPABASE_PUBLISHABLE_KEY="tu_publishable_key"
   VITE_SUPABASE_URL="https://tu_proyecto.supabase.co"
   ```
3. **Inicio del Servidor de Desarrollo:**  
   ```bash
   npm run dev
   ```
4. **Construcción para Producción (Build):**  
   ```bash
   npm run build
   ```

---
*IBIME | Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.*
