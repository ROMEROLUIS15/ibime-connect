# Estrategia de Inteligencia Artificial 🤖🧠

Este documento detalla la implementación, funcionamiento y medidas de seguridad de los sistemas de IA integrados en **IBIME Connect**.

## 🦉 Introducción: El Asistente Institucional

El asistente virtual del IBIME no es un chatbot de respuestas genéricas. Es un sistema de **Generación Aumentada por Recuperación (RAG)** con routing determinista y una capa de validación post-generación que garantiza que el LLM nunca controla el output final.

---

## 🏗️ Arquitectura de Decisión (Determinista + RAG)

El sistema evita delegar decisiones críticas al LLM mediante un **motor de clasificación de intenciones determinista** que precede a toda generación:

```
User
 ↓
IntentClassifier (regex, sin LLM)
 ├─ "registration" → DB directo → LLM solo formatea
 ├─ "catalog"      → RAG + LLM genera desde contexto
 └─ "general"      → RAG o fallback + LLM genera

LLM genera respuesta (acotado por system prompt)
 ↓
ResponsePolicy (ÚLTIMA CAPA — fuente de verdad del output)
 ├─ Validación estructural (vacío / muy corto / muy largo)
 ├─ Guardrail: bloquea alucinaciones de estado de usuario
 └─ Fallback por intent si cualquier check falla
 ↓
Output final (100% controlado por Policy, no por LLM)
```

### Principio fundamental
> **El LLM nunca es la última capa.** Su output siempre es interceptado y validado por `ResponsePolicy` antes de llegar al usuario.

---

## 🏗️ RAG: Retrieval-Augmented Generation

Para garantizar la veracidad y evitar alucinaciones, el sistema sigue este flujo:

1. **Ingesta**: El conocimiento institucional se fragmenta y se convierte en vectores matemáticos (embeddings).
2. **Consulta**: Cuando un usuario pregunta, su texto se convierte a vector en tiempo real.
3. **Recuperación**: Se buscan los 5 fragmentos más similares en la base de datos `pgvector` de Supabase.
   - **Umbral de similitud mínima: `0.65`** (fail-hard). Si ningún resultado supera este umbral, se rechazan todos — el LLM no recibe datos de baja calidad.
4. **Aumentación**: El contexto recuperado se inyecta en el prompt del sistema.
5. **Generación**: El modelo de lenguaje genera la respuesta **únicamente** basándose en ese contexto.

---

## 🛠️ Stack de Modelos y Proveedores

### 1. Google Gemini (gemini-embedding-001)
- **Función**: Convertir texto en vectores numéricos.
- **Dimensiones**: `outputDimensionality: 768` (compatible con `pgvector` en PostgreSQL).
- **Por qué**: Alta precisión semántica y excelente manejo del español técnico institucional.

### 2. Groq Cloud (Llama 3.1 8B Instant)
- **Función**: Motor de inferencia (generación de texto).
- **Por qué**: Latencia ultra baja, vital para la UX del ciudadano.
- **Parámetros reales de inferencia**:

| Flow | Temperatura | Max Tokens | Rol del LLM |
|:---|:---:|:---:|:---|
| `registration` (formateado) | `0.2` | `400` | Solo formatea datos de DB. Sin decisiones. |
| `catalog` (RAG generación) | `0.3` | `600` | Genera desde contexto RAG acotado. |
| `general` (RAG o fallback) | `0.3` | `500-600` | Responde con conocimiento institucional. |

---

## 🔒 Seguridad: Capas de Defensa Contra Alucinaciones

El sistema implementa **cuatro capas de defensa independientes**:

### 🛡️ Capa 1 — IntentClassifier (Pre-LLM)
Clasificación determinista por regex. El LLM nunca decide el routing. Las consultas de inscripción siempre van a la DB; nunca al LLM para que infiera.

### 🛡️ Capa 2 — RAGService Threshold (Pre-LLM)
Umbral mínimo de similitud coseno de `0.65`. Si ningún fragmento supera este umbral, el sistema entra en modo fail-hard y no inyecta contexto potencialmente irrelevante.

### 🛡️ Capa 3 — ResponseGuardrail (Post-LLM)
Motor de regex que detecta y bloquea alucinaciones de estado de usuario: frases como "no estás inscrito", "tu cuenta no aparece", "el correo no está registrado" son interceptadas cuando vienen de un flow sin datos de DB. Estas respuestas son reemplazadas por un fallback seguro.

### 🛡️ Capa 4 — ResponsePolicy (Post-LLM, ÚLTIMA PUERTA)
La fuente de verdad final del output:
- **Validación estructural**: respuestas vacías, menores a 10 caracteres o mayores a 1500 caracteres son bloqueadas.
- **Guardrail integrado**: invoca ResponseGuardrail con conciencia del flag `isDbBacked`.
- **`isDbBacked=false` + flow `registration`**: fuerza el guardrail en modo `general` para que el whitelist del flow `registration` no pueda ser bypasseado si no hay datos reales de DB.
- **Fallbacks por intent**: cada flow tiene su fallback específico con información de contacto del IBIME.

### 🛡️ Prompt Shielding (System Prompt Hardened)
El system prompt está diseñado con principios de seguridad:
- **Prohibición explícita** de inferir estado de usuario sin datos de DB.
- **Defensa contra prompt injection**: el contenido RAG y los mensajes de usuario son tratados como datos, nunca como instrucciones ejecutables.
- **Sin lógica de negocio**: el prompt solo define rol, datos institucionales y restricciones. Todo el routing lo hace el Orchestrator.

### 🔑 Aislamiento de Credenciales
Todas las llaves de API (`GROQ_API_KEY`, `GEMINI_API_KEY`) residen exclusivamente en el entorno del servidor. Nunca se exponen al navegador ni al frontend.

### 🔍 Validación de Entrada (Zod)
Antes de llegar al motor de IA, cada mensaje del usuario es validado estructuralmente con esquemas Zod compartidos (`shared/validators/schemas.ts`).

---

## ⚡ Optimización con Redis (Capa de Caché)

La IA es un recurso costoso en términos de latencia y computación. Implementamos caché en dos niveles:

- **Caché de Embeddings (24h)**: misma pregunta → mismo vector → Redis responde en nanosegundos.
- **Caché de Resultados RAG (1h)**: consultas idénticas se sirven directamente desde Redis, eliminando el tiempo de espera del LLM.

---
*La Inteligencia Artificial al servicio de la transparencia y la eficiencia institucional.*
