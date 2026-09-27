import { describe, it, expect } from 'vitest';
import { findAdjacentChapters } from '$lib/stores/chapters.svelte.js';

describe('findAdjacentChapters', () => {
  const chapters = ['/book/ch1.md', '/book/ch2.md', '/book/ch3.md'];

  it('returns null prev for first chapter', () => {
    const { prev, next } = findAdjacentChapters(chapters, '/book/ch1.md');
    expect(prev).toBeNull();
    expect(next).toBe('/book/ch2.md');
  });

  it('returns null next for last chapter', () => {
    const { prev, next } = findAdjacentChapters(chapters, '/book/ch3.md');
    expect(prev).toBe('/book/ch2.md');
    expect(next).toBeNull();
  });

  it('returns both for middle chapter', () => {
    const { prev, next } = findAdjacentChapters(chapters, '/book/ch2.md');
    expect(prev).toBe('/book/ch1.md');
    expect(next).toBe('/book/ch3.md');
  });

  it('returns null null for unknown path', () => {
    const { prev, next } = findAdjacentChapters(chapters, '/book/unknown.md');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });

  it('handles empty chapters list', () => {
    const { prev, next } = findAdjacentChapters([], '/book/ch1.md');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});
