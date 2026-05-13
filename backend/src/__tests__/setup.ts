/**
 * Vitest global setup — runs before every test file.
 *
 * reflect-metadata is required by tsyringe decorators (@injectable, @inject).
 * Must be imported ONCE before any module that uses tsyringe decorators.
 */
import 'reflect-metadata';
