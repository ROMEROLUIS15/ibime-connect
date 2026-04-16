# 🛡️ Sistema de Calidad de Código — Pre-Commit Quality Gate

Este documento describe la configuración completa del sistema de calidad de código automatizada en **IBIME Connect**, basada en **Husky v9**, **lint-staged** y **ESLint**.

---

## 📐 Visión General

Cada vez que un desarrollador hace `git commit` o `git push`, el sistema ejecuta una cadena de validaciones automáticas que garantizan que ningún código con errores de estilo, tipos rotos o tests fallidos llegue al repositorio.

```
┌──────────────────────────────────────────────────────────────┐
│           Developer Workflow — Quality Gate                   │
├──────────────────────────────────────────────────────────────┤
│  git commit                                                   │
│    └─► pre-commit hook                                        │
│          └─► lint-staged → ESLint --fix (solo staged files)   │
│                                                               │
│  git push                                                     │
│    └─► pre-push hook                                          │
│          ├─► [1/3] ESLint (lint completo del proyecto)        │
│          ├─► [2/3] TypeScript (tsc --noEmit)                  │
│          └─► [3/3] Vitest (test suite completa)               │
│                                                               │
│  ✓ Todo pasa → operación permitida                            │
│  ✗ Algún fallo → operación cancelada + diagnóstico detallado  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencias Instaladas

Instaladas en `devDependencies` del `package.json` **raíz** del monorepo:

| Paquete | Versión | Propósito |
|:---|:---|:---|
| `husky` | `^9.1.7` | Gestor de Git hooks para Node.js |
| `lint-staged` | `^16.4.0` | Ejecuta linters solo sobre archivos en staging |

> **Nota**: Se instalaron con `--legacy-peer-deps` por compatibilidad con Node.js 18 LTS (lint-staged ≥16 requiere oficialmente Node ≥20, pero funciona correctamente en 18).

```bash
npm install --save-dev husky@^9.1.7 lint-staged@^16.4.0 --legacy-peer-deps
```

---

## ⚙️ Configuración en `package.json` (raíz)

```json
{
  "scripts": {
    "dev":       "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"",
    "lint":      "npm run lint --prefix frontend",
    "typecheck": "npm run typecheck --prefix frontend",
    "test":      "npm run test --prefix frontend",
    "prepare":   "husky"
  },
  "lint-staged": {
    "frontend/**/*.{js,jsx,ts,tsx}": [
      "eslint --fix"
    ]
  }
}
```

### Detalle de scripts

| Script | Comando delegado | Propósito |
|:---|:---|:---|
| `npm run lint` | `eslint .` (desde `frontend/`) | ESLint sobre todo el frontend |
| `npm run typecheck` | `tsc --noEmit` (desde `frontend/`) | Verificación de tipos sin emitir archivos |
| `npm run test` | `vitest run` (desde `frontend/`) | Ejecución completa de la suite de tests |
| `npm run prepare` | `husky` | Inicializa los hooks de Git (auto-ejecutado por `npm install`) |

### Configuración `lint-staged`

El bloque `lint-staged` define qué acciones ejecutar sobre qué archivos en el staging area. Solo actúa sobre archivos **realmente modificados y añadidos al index de Git**, lo que hace el proceso extremadamente rápido incluso en proyectos grandes.

---

## 🪝 Hooks de Git

### `.husky/pre-commit`

> **Formato Husky v9**: sin shebang, sin líneas extras. Un solo comando.

```sh
npx lint-staged
```

**Comportamiento**: Cuando ejecutas `git commit`, este hook intercepta la operación antes de crear el commit, corre `lint-staged`, que a su vez aplica `eslint --fix` sobre todos los archivos `*.{js,jsx,ts,tsx}` que están en el staging area. Si ESLint encuentra errores que no puede auto-corregir, el commit es cancelado.

---

### `.husky/pre-push`

> **Formato**: con shebang `#!/usr/bin/env sh` porque es un script complejo con lógica condicional.

El hook pre-push implementa un **Quality Gate completo** en 3 etapas secuenciales:

```
╔═══════════════════════════════════════════════════════════╗
║  PRE-PUSH QUALITY GATE                                    ║
╚═══════════════════════════════════════════════════════════╝

[1/3] ESLint       → npm run lint
[2/3] TypeScript   → npm run typecheck
[3/3] Vitest       → npm test

Results: X passed, Y failed of 3
```

#### Etapas del Quality Gate

| Etapa | Comando | ¿Qué verifica? | En caso de fallo |
|:---:|:---|:---|:---|
| 1 | `npm run lint` | Errores de ESLint en el frontend | Muestra los primeros 20 errores + sugerencia de `--fix` |
| 2 | `npm run typecheck` | Errores de TypeScript (`tsc --noEmit`) | Lista hasta 10 errores de tipo + sugiere revisión manual |
| 3 | `npm test` | Suite Vitest completa | Muestra tests fallidos + diagnóstico inteligente por tipo de error |

#### Diagnóstico inteligente de errores de test

El hook detecta el patrón del error y ofrece una sugerencia específica:

| Patrón detectado | Sugerencia |
|:---|:---|
| `invariant expected app router` | Mock de `next/navigation` faltante |
| `is not a function` | Mock de método en Supabase/servicio faltante |
| `Cannot find module` | Error de import path o dependencia faltante |
| Otros | Ejecutar test específico directamente |

#### Comportamiento de fallo

- Las 3 etapas **siempre se ejecutan** (no hay early-exit). Esto asegura que el desarrollador ve **todos** los problemas en un solo push, no uno a la vez.
- Si **cualquier** etapa falla, el push es cancelado con el mensaje:
  ```
  Push cancelled — fix errors above and retry.
  ```
- Si todas pasan:
  ```
  All checks passed! Proceeding with push...
  ```

---

## 🎨 ESLint — Configuración del Frontend

El frontend usa **ESLint v9 con flat config** (`eslint.config.js`), el nuevo formato estándar:

```js
// frontend/eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
```

**Plugins activos**:
- `@eslint/js` — Reglas base de JavaScript
- `typescript-eslint` — Reglas de TypeScript (strict recommended)
- `eslint-plugin-react-hooks` — Reglas de hooks de React (exhaustive-deps, etc.)
- `eslint-plugin-react-refresh` — Validación de exports para HMR de Vite

---

## 📁 Archivos del Sistema

```
ibime-connect/
├── .husky/
│   ├── pre-commit          ← Hook: npx lint-staged (Husky v9, sin shebang)
│   ├── pre-push            ← Hook: Quality Gate 3 etapas (con shebang)
│   └── _/
│       ├── h               ← Binario interno de Husky v9
│       ├── husky.sh        ← Script de inicialización de hooks
│       └── ...             ← Stubs de otros hooks de Git
│
├── frontend/
│   ├── eslint.config.js    ← Flat config ESLint v9
│   └── package.json        ← + script "typecheck": "tsc --noEmit"
│
└── package.json            ← + scripts lint/typecheck/test/prepare
                               + bloque "lint-staged"
```

---

## 🔄 Flujo Completo de un Desarrollador

```bash
# 1. Trabajas en una feature
git checkout -b feat/nueva-funcionalidad

# 2. Modificas archivos TypeScript/React
vim frontend/src/components/MiComponente.tsx

# 3. Añades al staging
git add frontend/src/components/MiComponente.tsx

# 4. Haces commit → se activa pre-commit
git commit -m "feat: añadir MiComponente"
# → lint-staged corre ESLint --fix sobre MiComponente.tsx
# → Si hay errores auto-corregibles: los corrige y el commit procede
# → Si hay errores manuales: el commit es cancelado con el diagnóstico

# 5. Haces push → se activa pre-push
git push origin feat/nueva-funcionalidad
# → [1/3] ESLint sobre todo el frontend
# → [2/3] tsc --noEmit verifica todos los tipos
# → [3/3] vitest run ejecuta todos los tests
# → Si todo pasa: el push procede
# → Si algo falla: el push es cancelado con diagnóstico + sugerencias
```

---

## ⚠️ Notas Importantes

### Formato de hooks — Husky v9 vs v8

| | Husky v8 (deprecado) | Husky v9 (actual) |
|:---|:---|:---|
| `pre-commit` | `#!/usr/bin/env sh` + `. "$(dirname "$0")/_/husky.sh"` | Solo el comando: `npx lint-staged` |
| `pre-push` | Igual que arriba | Con `#!/usr/bin/env sh` (si es script complejo) |
| Crear hooks | `npx husky add .husky/pre-commit` | Crear el archivo directamente |

### Omitir hooks temporalmente (casos de emergencia)

```bash
# Saltar pre-commit
git commit --no-verify -m "wip: trabajo en progreso"

# Saltar pre-push
git push --no-verify origin rama
```

> ⚠️ Usar `--no-verify` solo en casos justificados. Los hooks existen para proteger la rama `main`.

### El hook `prepare` y CI/CD

El script `"prepare": "husky"` en `package.json` se ejecuta automáticamente con `npm install`. En entornos CI (GitHub Actions, Render), Husky detecta que no está en un repo Git local y **se omite silenciosamente**, sin causar errores en el pipeline de deployment.

---

## 🧪 Verificación de la Instalación

```bash
# Verificar que los archivos internos de Husky existen
ls .husky/_/h        # debe mostrar el archivo
ls .husky/pre-commit # debe mostrar el hook
ls .husky/pre-push   # debe mostrar el hook

# Verificar permisos de ejecución
ls -la .husky/pre-commit   # debe tener -rwxr-xr-x
ls -la .husky/pre-push     # debe tener -rwxr-xr-x

# Probar lint-staged manualmente (sin commit)
git add frontend/src/algún-archivo.tsx
npx lint-staged

# Probar el quality gate manualmente (sin push)
npm run lint && npm run typecheck && npm test
```

---

*Sistema implementado en IBIME Connect v2.2.0 — Abril 2026.*
