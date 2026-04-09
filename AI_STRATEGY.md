# Estrategia de Inteligencia Artificial 🤖🧠

Este documento detalla la implementación, funcionamiento y medidas de seguridad de los sistemas de IA integrados en **IBIME Connect**.

## 🦉 Introducción: El Asistente Búho
El asistente virtual del IBIME no es un simple chatbot de respuestas genéricas. Es un sistema de **Generación Aumentada por Recuperación (RAG)** diseñado para actuar como un experto institucional, proporcionando información precisa basada exclusivamente en la base de conocimientos oficial del instituto.

## 🏗️ arquitectura RAG (Retrieval-Augmented Generation)

Para garantizar la veracidad y evitar "alucinaciones" (respuestas inventadas), el sistema sigue este flujo técnico:

1.  **Ingesta**: El conocimiento institucional se fragmenta y se convierte en vectores matemáticos (embeddings).
2.  **Consulta**: Cuando un usuario pregunta, su texto se convierte a vector en tiempo real.
3.  **Recuperación**: Se buscan los 5 fragmentos más similares en la base de datos `pgvector` de Supabase (Umbral de similitud: 0.4).
4.  **Aumentación**: El contexto recuperado se inyecta en el prompt del sistema.
5.  **Generación**: El modelo de lenguaje (LLM) genera la respuesta basándose **únicamente** en ese contexto.

## 🛠️ Stack de Modelos y Proveedores

### 1. Google Gemini (gemini-embedding-001)
- **Función**: Convertir texto en vectores numéricos. Aunque el modelo genera 3072 dimensiones por defecto, inyectamos el parámetro `outputDimensionality: 768` en la API (v1beta) para forzar un truncado matemático que coincide exactamente con las exigencias estructurales de `pgvector`.
- **Por qué**: Alta precisión semántica y excelente manejo del idioma español técnico.

### 2. Groq Cloud (Llama 3.1 8B Instant)
- **Función**: Motor de inferencia (generación de texto).
- **Por qué**: Es uno de los motores más rápidos del mundo, permitiendo respuestas casi instantáneas (baja latencia), lo cual es vital para la experiencia del usuario.

## ⚡ Optimización con Redis (Capa de Caché)

La IA es un recurso costoso en términos de latencia y computación. Por ello, implementamos una estrategia de caché en dos niveles:

- **Caché de Embeddings (24h)**: Si dos usuarios hacen la misma pregunta, el sistema no vuelve a llamar a la API de Gemini; recupera el vector directamente de Redis.
- **Caché de Respuestas RAG (1h)**: Consultas idénticas sobre temas institucionales se sirven directamente desde Redis, eliminando el tiempo de espera del LLM.

## 🔒 Seguridad y Privacidad

El sistema implementa múltiples capas de blindaje:

### 🛡️ Prompt Shielding
El `system_prompt` está diseñado para que la IA no responda a temas fuera del ámbito del IBIME, bibliotecas o cultura de Mérida. Si se intenta forzar un tema ajeno, el asistente redirige amablemente al usuario.

### 🔑 Aislamiento de Credenciales
Todas las llaves de API (`GROQ_API_KEY`, `GEMINI_API_KEY`) residen exclusivamente en el entorno del servidor (backend). Nunca se exponen al navegador del usuario ni a las funciones del frontend.

### 🔍 Validación de Entrada (Zod)
Antes de llegar a la IA, cada mensaje del usuario es validado estructuralmente para prevenir ataques de desbordamiento o caracteres maliciosos.

## ⚙️ Parámetros de Inferencia
- **Temperatura**: `0.6` (Equilibrio entre creatividad y precisión institucional).
- **Max Tokens**: `800` (Respuestas concisas y directas).
- **Top P**: `0.9` (Diversidad controlada en la selección de palabras).

---
*La Inteligencia Artificial al servicio de la transparencia y la eficiencia institucional.*
