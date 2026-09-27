import { describe, it, expect } from 'vitest';
import { slugify } from './markdown.js';

// Test via slugify since scroll functions need a browser DOM
describe('slugify (for heading IDs)', () => {
  it('produces valid CSS IDs', () => {
    const slug = slugify('Hello World!');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug).toBe('hello-world');
  });

  it('handles multi-word headings', () => {
    expect(slugify('Getting Started with ShelfMD')).toBe('getting-started-with-shelfmd');
  });

  it('strips leading and trailing hyphens', () => {
    const slug = slugify('  --test-- ');
    expect(slug).not.toMatch(/^-/);
    expect(slug).not.toMatch(/-$/);
  });

  it('lowercases all characters', () => {
    expect(slugify('UPPERCASE')).toBe('uppercase');
  });

  it('handles numbers', () => {
    expect(slugify('Chapter 1')).toBe('chapter-1');
  });
});
