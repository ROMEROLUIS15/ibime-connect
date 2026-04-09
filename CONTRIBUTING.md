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
3. Asegúrate de que los tests pasen (`npm test --prefix backend`).
4. Abre un Pull Request (PR) hacia `develop`.

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
# Ejecutar tests del backend
npm test --prefix backend
```

## 📬 Reporte de Errores

Si encuentras un error, por favor abre un **Issue** describiendo:
1. El comportamiento esperado.
2. El comportamiento actual.
3. Pasos detallados para reproducir el problema.

---
*Tu contribución ayuda a fortalecer el acceso a la cultura en el Estado Mérida.*
