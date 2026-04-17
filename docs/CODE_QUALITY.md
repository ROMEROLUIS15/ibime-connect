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
│    └─► .github/workflows/ci.yml                                         │
│          ├─► Configuración Node + Dependencias (--legacy-peer-deps)     │
│          ├─► Simulación de Entorno (Dummy Env Vars)                     │
│          └─► Ejecución de Quality Gate Remoto                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Configuración en `package.json` (Raíz)

Para gestionar ambos monorepos sin `workspaces` estrictos, se aplican delegadores paralelos en el archivo `package.json` principal:

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

### Dependencias Paralelas (Conflictos Peer)
El frontend y backend poseen instalaciones independientes con requerimientos cruzados para ESLint y TS. Por esto, instalar limpiamente a veces rompe los *lockfiles* por `ERESOLVE`. 
En todo flujo automatizado, se utiliza el parámetro `>=v20`:
`npm ci --legacy-peer-deps`

### Dummy Variables de Entorno (Evitando Crashes de Vitest)
La app backend contiene barreras en `src/config/env.config.ts` que interrumpen la ejecución (`process.exit(1)`) si escanean que faltan credenciales como `SUPABASE_URL` o `GROQ_API_KEY`.
Puesto que en GitHub Actions (en el entorno Node puro) no existe un `.env` ni nos interesa subir nuestros keys de producción al CI, incrustamos **variables ficticias** explícitamente en el workflow:

```yaml
      - name: Run Tests
        run: npm run test
        env:
          SUPABASE_URL: "http://dummy-supabase.url"
          SUPABASE_SERVICE_ROLE_KEY: "dummy-key"
          GEMINI_API_KEY: "dummy-key"
          GROQ_API_KEY: "dummy-key"
          REDIS_URL: "redis://localhost:6379"
```

Esto salta los candados de inicialización y permite a Vitest aislar satisfactoriamente todos los *mocks* sin afectar infraestructuras de terceros ni lanzar logs rojos.

---

## 🎨 ESLint v9 (Flat Config) — Backend & Frontend

Tanto el backend como el frontend ya migraron a **ESLint Flat Config** (por consiguiente, la ausencia de archivos `.eslintrc.json`).

*Archivo: `backend/eslint.config.js` y `frontend/eslint.config.js`*
- Permite directivas centralizadas `ignores: ["dist"]`.
- Soporte agnóstico a Node (para el backend) y a Browser/React (para el frontend).
- Uso obligatorio explícito del parámetro `cause: error` al enrutar instancias `new Error()` en el backend (Throw errors need causes).

---

## ⚠️ ¿Emergencias?

Si en algún momento bajo fuerza mayor debes bypassear estos candados (situación técnica atípica justificada):
* Usa `git commit --no-verify -m "wip"`
* Usa `git push --no-verify origin rama`

> *Documentación mantenida en abril 2026. Este sistema estandarizado no requiere herramientas arcaicas de TSLint ni perfiles globales disociados.*
