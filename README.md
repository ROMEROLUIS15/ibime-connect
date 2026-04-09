# 🏛️ IBIME Connect — Plataforma Digital Institucional

[![Vercel Deploy](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://ibime-connect.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tested-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Tested-2EAD33?style=flat&logo=playwright)](https://playwright.dev/)
[![Redis](https://img.shields.io/badge/Redis-Cached-DC382D?style=flat&logo=redis)](https://redis.io/)

**IBIME Connect** es el ecosistema digital oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida (**IBIME**). Una plataforma de vanguardia que integra Inteligencia Artificial, arquitectura modular y alto rendimiento para centralizar la interacción ciudadana y el acceso a la cultura.

🔗 **Acceso Público:** [ibime-connect.vercel.app](https://ibime-connect.vercel.app)

---

## 📂 Estructura del Proyecto

```text
ibime-connect/
├── .github/                  # Workflows automáticos (CI/CD y Heartbeats)
├── backend/                  # API y Lógica de Servidor (Node.js/Express/TypeScript)
│   ├── src/                  # Arquitectura Limpia (Controllers, Services, Domain, Infra)
│   └── package.json
├── e2e/                      # Pruebas automatizadas de Navegador (Playwright)
├── frontend/                 # Aplicación Cliente (React/Vite/Tailwind)
│   ├── src/                  # UI, Hooks, Context, Componentes
│   └── package.json
├── shared/                   # Single Source of Truth (Esquemas Zod y Tipos de Dominio)
├── supabase/                 # Migraciones y configuraciones de Base de Datos
├── AI_STRATEGY.md            # Visión Estratégica del Modelo RAG y Prompts
├── ARCHITECTURE.md           # Deep Dive de la Arquitectura Interna del sistema
├── CONTRIBUTING.md           # Guías de Integración para Nuevos Desarrolladores
├── README.md                 # Documentación Pública del Proyecto
├── playwright.config.ts      # Orquestador y ambiente virtual de UI Tests E2E
├── render.yaml               # Infraestructura como Código (IaC) en Producción
└── package.json              # Orquestador Root del Monorepo Global
```

---

## 🚀 Arquitectura Técnica y Estrategia Cloud

La plataforma ha sido diseñada bajo principios de **Arquitectura Limpia**, con un backend autosuficiente y una capa compartida de tipos. Como el proyecto funciona íntegramente sobre infraestructura *Free Tier*, implementa una **Arquitectura de Sostenibilidad** para prevenir apagones y borrados por inactividad.

### 🏗️ Backend Modular (Node.js + Express)
El núcleo del sistema utiliza un enfoque de **Inyección de Dependencias (DI)** mediante `tsyringe`, logrando un desacoplamiento total entre dominios e infraestructura.

### 🛡️ Orquestación de Capas Gratuitas (Keep-Alive Strategy)
Para garantizar 100% de disponibilidad sin "Cold Starts" y sin costos operativos:

1. **GitHub Actions (Supabase Heartbeat):** Un flujo automatizado interfiere cada 24 horas usando comandos `curl` para enviar pings a la API de Supabase, evadiendo la pausa técnica obligatoria de los 7 días.
2. **UptimeRobot (Render Backend):** Se configuró un barrido de puerto HTTP cada 14 minutos. Esto mantiene la instancia activa consumiendo las 750 horas de cómputo regalo mensuales de Render (24/7 de tiempo hábil), erradicando el retardo de 50 segundos del "Cold Start".
3. **Persistencia en Cascada (Redis Cloud):** Gracias al latido constante en Render, Node.js sostiene un `Socket TCP` ininterrumpido con RedisLabs, blindándolo contra la política de eliminación total por 30 días de inactividad.

### 🤖 Motor de IA & RAG (Retrieval-Augmented Generation)
1. **Embeddings (Gemini):** Vectores de 768 dimensiones optimizados para bases PostgreSQL (`pgvector`).
2. **Vector Search (Supabase):** Búsqueda de similitud de coseno en milisegundos.
3. **Inferencia (Groq/Llama 3.1):** Modelos ultra veloces condicionados contextualmente al entorno del IBIME.

---

## 🧪 Calidad y Pruebas Automatizadas

La integridad de la plataforma no se deja a la suerte, implementando la pirámide de la agilidad moderna:

### Tests Unitarios (Backend con Vitest)
Cubre lógica matemática de vectores, servicios y controladores.
```bash
# Ejecuta los tests ultrarrápidos y muestra reporte de cobertura
npm run test:coverage --prefix backend
```

### Tests E2E (End-to-End con Playwright)
Simulan el comportamiento humano visitando la aplicación como un navegador real, haciendo scroll, clic y comprobando visibilidad de objetos HTML. 
- Contamos con mockbacks e interceptores de red API (`page.route`) instalados en `chat.spec.ts` y `forms.spec.ts` para que los flujos de pruebas corran instantáneamente en entornos de Integración Continua (CI) sin agotar créditos comerciales ni saturar bases de datos.
```bash
# Correr tests E2E y generar reporte visual HTML de Playwright
npx playwright test
```

---

## 🌿 Estrategia de Control de Versiones (Branching Strategy)

Se aplica un flujo derivado de **GitHub Flow** para aislar ramas maduras y agilizar pases a Producción.

- `main`: Rama **Producción**. Vinculada directamente al Vercel CD y a Render CD. Recibe empujes (`push` / `merge`) única y estrictamente luego de pasar todas las validaciones de las capas estáticas.
- `development` *(opcional/estándar)*: Rama para agrupar nuevas features inestables u homologar comportamiento de los motores en Staging.
- Ramas efímeras (`fix/`, `feat/`, `docs/`): Usadas durante implementaciones ágiles, por ejemplo: `fix/symlink-node-modules` o `docs/architecture-update`. 

---

## 🛠️ Pila Tecnológica (Tech Stack)

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express, TypeScript, tsyringe |
| **Bases de Datos** | Supabase (PostgreSQL), pgvector, Redis (Cloud) |
| **IA & LLM** | Groq (Llama 3.1 70B), Google Gemini (Embeddings) |
| **Automatización** | GitHub Actions, Vitest, Playwright, UptimeRobot |

---

## ⚙️ Configuración y Ejecución Local

1. **Instalación de todas las capas:**
```bash
git clone <url-repo>
cd ibime-connect
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Copiar variables de entorno:**  
Asegúrate de tener un `.env` tanto en el directorio `backend` como en `frontend` basados en sus respectivos `*.example`. En caso del backend, la ruta de base de datos incluye `REDIS_URL` para conectividad caché.

3. **Ejecutar paralelamente (App Completa):**
```bash
# Lanza en paralelo Vite React (Port 5173 / 4000) y Node Express (Port 3000)
npm run dev
```

---

## 🛡️ Seguridad e Integridad
- **Zod Validations:** Reglas duras y compartidas (Backend / Frontend `shared/` directory) para proteger la salud de inyecciones maliciosas.
- **Express Rate Limit:** Límites de ventana defensivos para proteger llaves costosas ante DDOS.
- **Circuit Breakers (Graceful Degradation):** Si se pierde conexión con dependencias menores como Redis, la plataforma conmuta al disco principal avisando por logs de `Pino`, nunca sufriendo un Crash absoluto.

---
© 2026 Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.  
*Innovación tecnológica al servicio de la cultura y el conocimiento.*
