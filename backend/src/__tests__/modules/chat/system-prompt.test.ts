import { describe, it, expect } from 'vitest';
import { CHAT_SYSTEM_PROMPT } from '../../../modules/chat/system-prompt.js';

describe('CHAT_SYSTEM_PROMPT', () => {
  it('points citizens to the public Koha catalog (OPAC), not the staff login', () => {
    // :8000 es el catálogo público (OPAC); :8001 es el inicio de sesión del personal.
    expect(CHAT_SYSTEM_PROMPT).toContain('http://www.ibime.gob.ve:8000/');
    expect(CHAT_SYSTEM_PROMPT).not.toContain(':8001');
  });
});
