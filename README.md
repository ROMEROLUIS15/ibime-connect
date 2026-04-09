# 🏛️ IBIME Connect — Plataforma Digital Institucional

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ibime-connect.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Tested-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)
[![Redis](https://img.shields.io/badge/Redis-Cached-DC382D?style=flat&logo=redis)](https://redis.io/)

**IBIME Connect** es el ecosistema digital oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida (**IBIME**). Una plataforma de vanguardia que integra Inteligencia Artificial, arquitectura modular y alto rendimiento para centralizar la interacción ciudadana y el acceso a la cultura.

🔗 **Acceso Público:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## 🚀 Arquitectura Técnica (Deep Dive)

La plataforma ha sido rediseñada bajo principios de **Arquitectura Limpia** y **Diseño Orientado a Servicios**, garantizando escalabilidad y mantenibilidad.

### 🏗️ Backend Modular (Node.js + Express)
El núcleo del sistema utiliza un enfoque basado en **Inyección de Dependencias (DI)** mediante `tsyringe`, permitiendo un desacoplamiento total entre la lógica de negocio y los proveedores de infraestructura.

- **DI & Inversion of Control**: Gestión centralizada de dependencias para facilitar el testing y la extensibilidad.
- **Observabilidad (Pino)**: Sistema de logs estructurados en JSON con **Request Identification (`X-Request-ID`)** para trazabilidad end-to-end.
- **Seguridad Dinámica**: Rate limiting adaptativo y validación de esquemas estricta con **Zod**.

### 🤖 Motor de IA & RAG (Retrieval-Augmented Generation)
El asistente virtual ("Asistente Búho") utiliza una estrategia híbrida de última generación:

1.  **Embeddings (Gemini)**: Conversión de consultas en vectores semánticos utilizando el modelo `gemini-embedding-001`, truncados matemáticamente a 768 dimensiones preventivas para compatibilidad total de Storage.
2.  **Vector Search (Supabase/pgvector)**: Recuperación de contexto institucional relevante mediante similitud de coseno.
3.  **Inferencia (Groq/Llama 3.1)**: Generación de respuestas naturales y precisas en milisegundos.
4.  **Capa de Caché (Redis)**: 
    - **Embeddings**: Cacheo de vectores (24h) para reducir costos y latencia.
    - **Contexto**: Cacheo de resultados RAG (1h) para optimizar consultas recurrentes.

---

## 🌟 Funcionalidades Principales

- **🤖 Asistente Virtual 24/7**: Consultas institucionales con memoria de conversación y fuentes verificadas.
- **📝 Gestión de Registros**: Inscripción dinámica en cursos y eventos culturales con validación de datos en tiempo real.
- **🏛️ Portal de Transparencia**: Acceso a la Misión, Visión y patrimonio bibliográfico del Estado Mérida.
- **📧 Centro de Contacto**: Formulario profesional con auditoría de logs y trazabilidad de solicitudes.

---

## 🛠️ Pila Tecnológica (Tech Stack)

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express, TypeScript, tsyringe |
| **Bases de Datos** | Supabase (PostgreSQL), pgvector, Redis (Cloud) |
| **IA & LLM** | Groq (Llama 3.1 70B), Google Gemini (Embeddings) |
| **Infraestructura** | Pino (Logging), Zod (Validation), Express-Rate-Limit |

---

## ⚙️ Configuración y Ejecución

### 1. Requisitos Previos
- Node.js v20+
- Instancia de Redis (Local o Cloud)
- Proyecto en Supabase con `pgvector` habilitado.

### 2. Instalación
```bash
git clone <url-repo>
npm install
```

### 3. Variables de Entorno (Backend)
Crea un archivo `backend/.env` basado en el siguiente esquema:
```env
PORT=3000
SUPABASE_URL="tu_url"
SUPABASE_SERVICE_ROLE_KEY="tu_key"
GEMINI_API_KEY="tu_key"
GROQ_API_KEY="tu_key"
REDIS_URL="redis://default:tu_password@host:port"  # Si es Redis Cloud, debe llevar el usuario 'default'
```

### 4. Ejecución
Sube el frontend y backend simultáneamente:
```bash
npm run dev
```

---

## 🧪 Calidad y Pruebas (Test Suite)

La robustez del sistema está respaldada por una suite de pruebas completa con **Vitest**:

- **Unit Testing**: Cobertura de >90% en servicios core (`Chat`, `RAG`, `Embedding`).
- **Integration Testing**: Validación de flujos completos de API y comunicación con Supabase.
- **Coverage Reports**: Generación de informes de cobertura detallados.

```bash
# Ejecutar tests
npm test --prefix backend

# Ver cobertura
npm run test:coverage --prefix backend
```

---

## 🛡️ Seguridad e Integridad
- **Validación E2E**: Todos los modelos de datos son validados con Zod antes de tocar la base de datos.
- **Rate Limit**: Protección contra ataques de fuerza bruta y DoS en endpoints sensibles.
- **Caché Inteligente**: Redis previene el abuso de APIs pagas (LLMs) mediante el almacenamiento temporal de resultados comunes.

---
© 2026 Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.  
*Innovación tecnológica al servicio de la cultura y el conocimiento.*
