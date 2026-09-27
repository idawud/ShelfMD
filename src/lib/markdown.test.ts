import { describe, it, expect } from 'vitest';
import { slugify, extractHeadings } from './markdown.js';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips punctuation', () => {
    expect(slugify('Getting Started!')).toBe('getting-started');
  });

  it('handles consecutive dashes', () => {
    expect(slugify('C++ Notes')).toBe('c-notes');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('  Hello  ')).toBe('hello');
  });
});

describe('extractHeadings', () => {
  it('extracts all heading levels', () => {
    const md = '# H1\n## H2\n### H3\n';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toMatchObject({ level: 1, text: 'H1', slug: 'h1', line: 0 });
    expect(headings[1]).toMatchObject({ level: 2, text: 'H2', slug: 'h2', line: 1 });
    expect(headings[2]).toMatchObject({ level: 3, text: 'H3', slug: 'h3', line: 2 });
  });

  it('deduplicates slugs', () => {
    const md = '# Foo\n# Foo\n# Foo\n';
    const headings = extractHeadings(md);
    expect(headings[0].slug).toBe('foo');
    expect(headings[1].slug).toBe('foo-1');
    expect(headings[2].slug).toBe('foo-2');
  });
});
