# Política de Retención y Respaldo de Datos Personales

> **Estado: PROPUESTA.** Los plazos y decisiones marcados con ⚠️ requieren
> ratificación institucional/legal antes de activarse. Ningún borrado automático
> está habilitado a día de hoy.

IBIME Connect trata datos personales de ciudadanos (nombre, correo, teléfono).
Al ser una institución del Estado, la retención, el respaldo y los derechos de
los titulares deben estar definidos explícitamente. Este documento inventaría
qué datos se guardan, propone plazos y describe el mecanismo de purga y respaldo.

## 1. Inventario de datos personales

| Almacén | Datos | Sensibilidad | Propósito | Retención propuesta |
|---|---|---|---|---|
| `course_registrations` | nombre, correo, teléfono, curso | Media (PII + contacto) | Registro de inscripciones; verificación de propiedad en el chat | ⚠️ **Operativa**: se conserva mientras el registro sea vigente. Ver §2. |
| `contact_messages` | nombre, correo, mensaje | Media | Mensajes del formulario de contacto | ⚠️ **12 meses** y luego purga |
| Redis (`session:*`) | correo de sesión | Baja (efímero) | Privacy Gate del chat | **30 min TTL** (ya implementado) |
| Redis (`groq:rl:*`) | contadores de cuota | Ninguna | Rate-limiting | ≤ 25 h TTL (ya implementado) |
| Logs (Pino / Render) | correo **enmascarado** (`j***@x.com`) | Baja | Auditoría/depuración | Según retención de Render (efímera en free) |
| Sentry (si se activa) | error + contexto sin PII | Baja | Alertas | Según plan de Sentry |
| `knowledge_base` / `ibime_knowledge` | — | N/A (no PII) | RAG | — |

**Encargados del tratamiento (terceros a los que se envían datos):** Supabase
(base de datos), Groq (mensajes del chat para inferencia), Google Gemini (texto
para *embeddings*), Cloudinary (media), Render (hosting + **Render Key Value**
para sesión/cuota, en su red interna) y Vercel (hosting). ⚠️ Deben declararse en
el aviso de privacidad (§4).

## 2. Plazos de retención (propuesta)

- **`contact_messages` → 12 meses.** Son consultas puntuales; pasado un año
  pierden utilidad. Purga recomendada.
- **`course_registrations` → conservación operativa.** Borrarlas rompería la
  verificación de inscripciones del chat. Recomendación: **no** purgar por tiempo
  de forma indiscriminada. ⚠️ *Limitación de esquema:* la tabla no guarda la fecha
  del curso, así que no se puede purgar "N meses después del curso". Si se quiere
  retención por tiempo, primero añadir `course_date`/`archived_at`. Alternativa:
  archivado/anonimización manual al cierre de cada cohorte.

## 3. Mecanismo de purga (listo, **no** programado)

La migración `..._data_retention_functions.sql` define funciones SQL de purga que
**no se ejecutan solas**. Quedan disponibles para invocarse manualmente o desde
un cron una vez ratificados los plazos:

```sql
-- Devuelve cuántas filas eliminaría/eliminó. retention_days configurable.
select public.purge_old_contact_messages(365);
```

Para automatizar (cuando se apruebe): un **Render Cron Job** o un **GitHub Action
programado** (como `heartbeat.yml`) que llame a la función vía RPC con la
`service_role` key, mensualmente. No se incluye habilitado a propósito.

## 4. Decisiones pendientes (⚠️ requieren tu ratificación)

1. **Plazos definitivos** de §2 (¿12 meses para contacto? ¿política para inscripciones?).
2. **Aviso de privacidad público** en el frontend: base legal, finalidad,
   encargados (§1), y datos de contacto del responsable. Hoy no existe.
3. **Derechos ARCO / de supresión:** procedimiento para borrar los datos de una
   persona a petición. La función `purge_person_data(email)` cubre la parte técnica.
4. **Habilitar o no** la purga programada, y con qué cadencia.

## 5. Respaldo (backup)

⚠️ **Hoy no hay respaldo.** El plan free de Supabase **no incluye PITR**; una
pérdida de datos sería irrecuperable.

Opciones (elegir una):

- **A — Supabase Pro** (recomendada si el dato importa): habilita *Point-in-Time
  Recovery* automático. Es la opción de menor esfuerzo operativo.
- **B — Respaldo lógico programado**: un GitHub Action mensual con `pg_dump`
  (usando una connection string en *secrets*) que cifre el volcado y lo suba a un
  destino de acceso controlado. ⚠️ El respaldo **también es PII**: debe cifrarse y
  restringirse. Requiere decidir destino y gestión de la clave.

**Recomendación:** dado que es data de ciudadanos, priorizar (A) o, si el
presupuesto lo impide, (B) con cifrado. No dejar producción sin respaldo.

---

*Documento vivo. Actualizar al ratificar plazos o cambiar el inventario de datos.*
