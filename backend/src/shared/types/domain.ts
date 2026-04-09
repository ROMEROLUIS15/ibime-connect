/**
 * backend/src/shared/types/domain.ts
 *
 * Local copy of shared domain types for backend use.
 * Kept in sync with the root shared/types/domain.ts.
 */

// ─── Knowledge / RAG ─────────────────────────────────────────────────────────

export type KnowledgeCategory =
  | 'libro'
  | 'evento'
  | 'tramite'
  | 'horario'
  | 'curso'
  | 'servicio'
  | 'contacto';

export interface KnowledgeEntry {
  readonly id: string;
  readonly category: KnowledgeCategory;
  readonly title: string;
  readonly content: string;
  readonly keywords: readonly string[] | null;
  readonly sourceUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeMatch {
  readonly id: string;
  readonly category: KnowledgeCategory;
  readonly title: string;
  readonly content: string;
  readonly similarity: number;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface ContactMessage {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface CreateContactMessageInput {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

// ─── Events / Registrations ──────────────────────────────────────────────────

export interface CourseRegistration {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly courseName: string;
  readonly createdAt: string;
}

export interface CreateCourseRegistrationInput {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly courseName: string;
}

// ─── Chat / Assistant ────────────────────────────────────────────────────────

export interface ChatMessage {
  readonly id: number;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly timestamp: Date;
  readonly sources?: readonly KnowledgeMatch[];
}

export interface ChatRequest {
  readonly userMessage: string;
  readonly conversationHistory: readonly Pick<ChatMessage, 'role' | 'text'>[];
}

export interface ChatResponse {
  readonly answer: string;
  readonly sources: readonly KnowledgeMatch[];
  readonly tokensUsed?: number;
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string };

// ─── Events (UI model — not DB model) ────────────────────────────────────────

export interface Event {
  readonly id: number;
  readonly image: string;
  readonly title: string;
  readonly date: string;
  readonly location: string;
  readonly description: string;
}
