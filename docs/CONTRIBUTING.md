# Guía de Contribución 🤝

¡Gracias por tu interés en colaborar con **IBIME Connect**! Para mantener la calidad y consistencia de este proyecto institucional, seguimos una serie de estándares técnicos y flujos de trabajo.

## 🛠️ Configuración del Entorno

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repo>
    cd ibime-connect
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    # También instala dependencias en subcarpetas si es necesario
    npm install --prefix frontend
    npm install --prefix backend
    ```
3.  **Configurar Variables de Entorno**:
    Copia los archivos `.env.example` a `.env` en las carpetas `backend/` y `frontend/` y completa los valores requeridos.

## 🌳 Estrategia de Ramas (Git Flow)

Para mantener la rama `main` siempre estable (producción), seguimos este flujo:

- `main`: Código estable en producción.
- `develop`: Rama principal de integración para nuevas funcionalidades.
- `feature/nombre-de-la-mejora`: Para desarrollar nuevas funcionalidades.
- `fix/nombre-del-error`: Para corregir errores detectados.

**Proceso**:
1. Crea una rama desde `develop`.
2. Realiza tus cambios.
3. Asegúrate de que los tests pasen (`npm run test --prefix backend`).
4. Abre un Pull Request (PR) hacia `develop`.

## 🤖 Sistema de Calidad Automática (Husky + lint-staged)

Al hacer `npm install`, se inicializan automáticamente los hooks de Git. No necesitas configurar nada extra.

### Al hacer `git commit`
Se ejecuta `lint-staged`, que aplica **ESLint con auto-fix** sobre los archivos TypeScript/JavaScript que tienes en staging. Si hay errores que ESLint no puede corregir solo, el commit es cancelado con el mensaje de error.

### Al hacer `git push`
Se activa el **Quality Gate completo** en 3 etapas:
1. **ESLint** — `npm run lint`
2. **TypeScript** — `npm run typecheck` (tsc --noEmit)
3. **Vitest** — `npm test`

Si alguna etapa falla, el push es cancelado y se muestra el diagnóstico con sugerencias de corrección.

> Si necesitas saltar los hooks en un caso excepcional (ej. WIP):
> ```bash
> git commit --no-verify -m "wip: trabajo en progreso"
> git push --no-verify
> ```
> ⚠️ Usar solo cuando esté justificado. Los hooks protegen la rama `main`.

> 📄 Ver documentación completa del sistema: [`CODE_QUALITY.md`](./CODE_QUALITY.md)

## 💻 Estándares de Código

### TypeScript
- Usamos **Typed TypeScript** riguroso. Evita el uso de `any`.
- Los nombres de interfaces deben empezar con `I` (ej: `IEmbeddingService`).

### Backend (Node.js)
- Respetar el patrón de **Inyección de Dependencias** con `tsyringe`.
- Todo nuevo servicio debe tener su interfaz definida en `src/domain/interfaces`.
- Usar el `contextLogger` para mantener la trazabilidad de peticiones.

### Frontend (React)
- Usar componentes funcionales y Hooks.
- Estilos exclusivamente con **Tailwind CSS**.
- Usar componentes de `shadcn/ui` siempre que sea posible.

## 🧪 Testing

No se aceptarán Pull Requests que rompan la suite de pruebas existente o que no incluyan pruebas para nueva lógica de negocio compleja.

```bash
# Tests del backend (Vitest)
npm test --prefix backend

# Tests del frontend (Vitest)
npm run test --prefix frontend

# TypeCheck del frontend
npm run typecheck  # desde la raíz

# Lint
npm run lint       # desde la raíz
```

## 📬 Reporte de Errores

Si encuentras un error, por favor abre un **Issue** describiendo:
1. El comportamiento esperado.
2. El comportamiento actual.
3. Pasos detallados para reproducir el problema.

---
*Tu contribución ayuda a fortalecer el acceso a la cultura en el Estado Mérida.*
