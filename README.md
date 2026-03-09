# 🏛️ IBIME Connect — Plataforma Institucional del Estado Mérida

[![Vercel Deployment](https://img.shields.io)](https://ibime-connect.vercel.app)
[![Supabase](https://img.shields.io)](https://supabase.com)
[![React](https://img.shields.io)](https://reactjs.org)

**IBIME Connect** es el ecosistema digital oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Mérida (**IBIME**). Esta plataforma centraliza la interacción ciudadana, la gestión cultural y el acceso a la información pública mediante tecnologías de última generación.

🔗 **Acceso Público:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## 🛠️ Capacidades Tecnológicas

- **🤖 Inteligencia Artificial:** Asistente virtual con memoria de contexto para atención al ciudadano.
- **📂 Memoria Vectorial:** Base de datos inteligente con **pgvector (Supabase)** para búsqueda de conocimiento.
- **📩 Infraestructura de Contacto:** Gestión de comunicaciones mediante **Resend** para envíos transaccionales.
- **✨ Diseño Institucional:** Interfaz premium con **Glassmorphism**, adaptada a la identidad visual de la Gobernación de Mérida.

---

## 🔒 Propiedad e Integridad

Este repositorio contiene el código fuente **privado y exclusivo** de la institución. 

- **Acceso Restringido:** El desarrollo y mantenimiento es realizado únicamente por el equipo técnico autorizado.
- **Seguridad:** Implementa protección de variables de entorno, rotación de API Keys y políticas RLS (Row Level Security).
- **Licencia:** Todos los derechos reservados © 2026 **IBIME**. Queda prohibida la reproducción o distribución total o parcial de este código sin autorización previa.

---

## 🚀 Stack de Desarrollo


| Componente | Tecnología |
| :--- | :--- |
| **Frontend** | React 18 + Vite |
| **Backend / DB** | Supabase (PostgreSQL) |
| **Lenguaje** | TypeScript (Strict Mode) |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Emailing** | Resend API |

---

## ⚙️ Ejecución en Entorno de Desarrollo

*Este apartado es exclusivo para el administrador del sistema en entornos Debian/Windows:*

1. **Dependencias:** `npm install`
2. **Entorno:** Configurar archivo `.env` con credenciales de Supabase (ID, URL, ANON_KEY).
3. **Inicio:** `npm run dev`
4. **Build:** `npm run build`

---
**Gobernación del Estado Mérida** — *Cultura y Tecnología para el Pueblo.*
