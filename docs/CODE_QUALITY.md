# 🛡️ Sistema de Calidad de Código — Local & Cloud Quality Gate

Este documento describe la arquitectura técnica de validación estricta para **IBIME Connect**, la cual previene la inyección de código defectuoso empleando verificaciones locales con **Husky v9**, **lint-staged**, **ESLint v9** y una pipeline en la nube mediante **GitHub Actions**.

---

## 📐 Visión General y Flujo de Trabajo

El sistema actúa en tres fases de defensa. Garantiza que el código defectuoso (errores de linting, tipos estáticos no resueltos o tests fallidos) nunca llegue a producción ni rompa las ramas principales.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Niveles del Quality Gate                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 1️⃣ git commit (Defensa Local Nivel 1)                                   │
│    └─► pre-commit hook                                                  │
│          └─► lint-staged → ESLint --fix (frontend y backend, staged)    │
│                                                                         │
│ 2️⃣ git push (Defensa Local Nivel 2)                                     │
│    └─► pre-push hook                                                    │
│          ├─► [1/3] ESLint (frontend + backend completo)                 │
│          ├─► [2/3] TypeScript (frontend + backend completo)             │
│          └─► [3/3] Vitest (Test suites completas)                       │
│                                                                         │
│ 3️⃣ GitHub Pull Request / Push (Defensa Nube Nivel 3)                    │
│    ├─► .github/workflows/ci.yml (Rápido: ~1m — Node 22)                 │
│    │     ├─► Instalación con --legacy-peer-deps                         │
│    │     ├─► npm audit --audit-level=high (back + front, no bloqueante) │
│    │     ├─► Simulación de Entorno (Dummy Env Vars)                     │
│    │     └─► Quality Gate Remoto (419 tests: 384 back + 35 front)       │
│    │                                                                    │
│    └─► .github/workflows/e2e.yml (Pesado: ~3m)                          │
│          ├─► Configuración Node + Dependencias                          │
│          ├─► Instalación de navegadores Chromium                        │
│          ├─► Arranque de Frontend y Backend (`npm run dev`)             │
│          └─► Playwright Tests (Con Mocking de Peticiones IA)            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Configuración en `package.json` (Raíz)

Para gestionar ambos proyectos sin `workspaces` estrictos, se aplican delegadores paralelos en el archivo `package.json` principal:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"",
    "lint": "npm run lint --prefix frontend && npm run lint --prefix backend",
    "typecheck": "npm run typecheck --prefix frontend && npm run typecheck --prefix backend",
    "test": "npm run test --prefix frontend && npm run test --prefix backend",
    "prepare": "husky || true"
  },
  "lint-staged": {
    "frontend/**/*.{js,jsx,ts,tsx}": [
      "npm run lint --prefix frontend --"
    ],
    "backend/**/*.{js,jsx,ts,tsx}": [
      "npm run lint --prefix backend --"
    ]
  }
}
```

### El Fallback de Husky
Es fundamental **siempre usar `"prepare": "husky || true"`**. En plataformas como Vercel o Render (sistemas de solo despliegue), Husky y otras dependencias de desarrollo no existen en `node_modules` durante la fase de despliegue. Si ponemos solamente `"husky"`, el servidor arrojará el temido **`Exit code 127: husky command not found`**. Al añadir `|| true`, permitimos que los entornos en la nube omitan amigablemente la instalación de Git hooks locales.

---

## 🪝 Git Hooks Locales (Husky)

### `.husky/pre-commit`
**Formato Husky v9**: Un solo comando, sin encabezados bash anticuados.
`npx lint-staged`

### `.husky/pre-push`
Este script previene pushes que rompan compilaciones asíncronas. Ejecuta:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`

*(Cualquier fallo detiene inmediatamente la propagación hacia GitHub al detectarse código anómalo).*

---

## ☁️ Integración Continua (GitHub Actions)

El archivo en `.github/workflows/ci.yml` asegura que los Pull Requests y merges tengan el sello de garantía (el Check Verde en la interfaz de GitHub).

### Runtime: Node.js 22
El CI corre sobre **Node 22** (`actions/setup-node` con `node-version: '22'`), igual que Render (`NODE_VERSION=22.11.0`) y el `engines` del backend (`>=22`). El motivo: `@supabase/supabase-js` 2.110+ requiere el `WebSocket` nativo disponible desde Node 22; con Node 20 el backend no arranca.

### Dependencias Paralelas (Conflictos Peer)
El frontend y backend poseen instalaciones independientes con requerimientos cruzados para ESLint y TS. Por esto, instalar limpiamente a veces rompe los *lockfiles* por `ERESOLVE`. En todo flujo automatizado se usa:
`npm ci --legacy-peer-deps`

### Dummy Variables de Entorno (Evitando Crashes del Backend)
La app backend contiene barreras pre-inicio en `src/config/env.config.ts` que interrumpen la ejecución (`process.exit(1)`) si detectan que faltan credenciales como `SUPABASE_URL` o `GROQ_API_KEY`.
Puesto que en GitHub Actions no exponemos un `.env` completo ni deseamos que los tests consuman quotas reales de producción, incrustamos **variables ficticias (Dummy)** tanto en el pipeline de CI como en el E2E:

```yaml
        env:
          SUPABASE_URL: "http://dummy-supabase.url"
          SUPABASE_SERVICE_ROLE_KEY: "dummy-key"
          GEMINI_API_KEY: "dummy-key"
          GROQ_API_KEY: "dummy-key"
          REDIS_URL: "redis://localhost:6379"
```

### El Flujo E2E (Playwright) Independiente
Contrario a los tests unitarios (`ci.yml`), el archivo `.github/workflows/e2e.yml` levanta simulaciones de red *con navegadores verdaderos*. Para no impactar en cuotas y salvaguardar la pureza de las pruebas sin requerir las claves maestras, los archivos Playwright usan **Mocking a nivel de red** (`page.route()`). Esto significa que el Frontend se comunica con el Backend normal, pero el *LLM* siempre está simulado, brindando robustez End-to-End sin costos asociados y sin la lentitud del servidor remoto de Groq.

---

## 🎨 ESLint v9 (Flat Config) — Backend & Frontend

Tanto el backend como el frontend ya migraron a **ESLint Flat Config** (por consiguiente, la ausencia de archivos `.eslintrc.json`).

*Archivo: `backend/eslint.config.js` y `frontend/eslint.config.js`*
- Permite directivas centralizadas `ignores: ["dist"]`.
- Soporte agnóstico a Node (para el backend) y a Browser/React (para el frontend).
- Uso obligatorio explícito del parámetro `cause: error` al enrutar instancias `new Error()` en el backend (Throw errors need causes).

---

## 🤖 Dependabot, `npm audit` y Cobertura

- **`.github/dependabot.yml`**: abre PRs semanales de actualización para la raíz, `backend/`, `frontend/` y `github-actions`. Los *minor/patch* se agrupan para no inundar de PRs; los *majors* llegan sueltos para revisarse uno a uno. **Los bumps de major (Node, TypeScript, redis, etc.) no se auto-mergean** — cada uno puede romper y debe probarse en su rama.
- **`npm audit --audit-level=high`** corre en CI (backend y frontend). Hoy es **no-bloqueante** (`continue-on-error`) mientras se saneia el árbol; endurecer a bloqueante cuando esté limpio.
- **Umbrales de cobertura** (`backend/vitest.config.ts`): `statements 82 / branches 74 / functions 78 / lines 82`, unos puntos por debajo del actual (~85/79/83/87) para gatear regresiones sin ser frágiles ante el flake ocasional del worker. Se miden con `npm run test:coverage --prefix backend`.

---

## ⚠️ ¿Emergencias?

Si en algún momento bajo fuerza mayor debes bypassear estos candados (situación técnica atípica justificada):
* Usa `git commit --no-verify -m "wip"`
* Usa `git push --no-verify origin rama`

> *Documentación mantenida en abril 2026. Este sistema estandarizado no requiere herramientas arcaicas de TSLint ni perfiles globales disociados.*
