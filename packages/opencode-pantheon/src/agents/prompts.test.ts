import { describe, expect, it } from 'bun:test';
import { ENLIL_PROMPT } from './enlil';
import { ENKI_PROMPT } from './enki';
import { MARDUK_PROMPT } from './marduk';
import { ADAPA_PROMPT } from './adapa';
import { KULLA_PROMPT } from './kulla';
import { NANSHE_PROMPT } from './nanshe';
import { ENBILULU_PROMPT } from './enbilulu';
import { MUSHDAMMA_PROMPT } from './mushdamma';
import { ISIMUD_PROMPT } from './isimud';
import { ASALLUHI_PROMPT } from './asalluhi';

describe('Pantheon agent prompts', () => {
  it('ENLIL_PROMPT is a non-empty string', () => {
    expect(typeof ENLIL_PROMPT).toBe('string');
    expect(ENLIL_PROMPT.length).toBeGreaterThan(0);
  });

  it('ENKI_PROMPT is a non-empty string', () => {
    expect(typeof ENKI_PROMPT).toBe('string');
    expect(ENKI_PROMPT.length).toBeGreaterThan(0);
  });

  it('MARDUK_PROMPT is a non-empty string', () => {
    expect(typeof MARDUK_PROMPT).toBe('string');
    expect(MARDUK_PROMPT.length).toBeGreaterThan(0);
  });

  it('ADAPA_PROMPT is a non-empty string', () => {
    expect(typeof ADAPA_PROMPT).toBe('string');
    expect(ADAPA_PROMPT.length).toBeGreaterThan(0);
  });

  it('KULLA_PROMPT is a non-empty string', () => {
    expect(typeof KULLA_PROMPT).toBe('string');
    expect(KULLA_PROMPT.length).toBeGreaterThan(0);
  });

  it('NANSHE_PROMPT is a non-empty string', () => {
    expect(typeof NANSHE_PROMPT).toBe('string');
    expect(NANSHE_PROMPT.length).toBeGreaterThan(0);
  });

  it('ENBILULU_PROMPT is a non-empty string', () => {
    expect(typeof ENBILULU_PROMPT).toBe('string');
    expect(ENBILULU_PROMPT.length).toBeGreaterThan(0);
  });

  it('MUSHDAMMA_PROMPT is a non-empty string', () => {
    expect(typeof MUSHDAMMA_PROMPT).toBe('string');
    expect(MUSHDAMMA_PROMPT.length).toBeGreaterThan(0);
  });

  it('ISIMUD_PROMPT is a non-empty string', () => {
    expect(typeof ISIMUD_PROMPT).toBe('string');
    expect(ISIMUD_PROMPT.length).toBeGreaterThan(0);
  });

  it('ASALLUHI_PROMPT is a non-empty string', () => {
    expect(typeof ASALLUHI_PROMPT).toBe('string');
    expect(ASALLUHI_PROMPT.length).toBeGreaterThan(0);
  });
});
