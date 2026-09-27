import { describe, it, expect } from 'vitest';

// Test the SUMMARY.md parsing logic (mirrored in JS for testing)
function parseSummaryLinks(content: string): string[] {
  const links: string[] = [];
  for (const line of content.split('\n')) {
    const start = line.indexOf('](');
    if (start === -1) continue;
    const end = line.indexOf(')', start + 2);
    if (end === -1) continue;
    const rel = line.slice(start + 2, end).split('#')[0];
    if (rel.endsWith('.md') || rel.endsWith('.markdown')) {
      links.push(rel);
    }
  }
  return links;
}

describe('parseSummaryLinks', () => {
  it('extracts md links from SUMMARY.md format', () => {
    const summary = `# Summary
- [Intro](README.md)
- [Chapter 1](part1/ch01/README.md)
  - [Exercises](part1/ch01/exercises.md)
- [Chapter 2](part1/ch 02/README.md)
`;
    const links = parseSummaryLinks(summary);
    expect(links).toEqual([
      'README.md',
      'part1/ch01/README.md',
      'part1/ch01/exercises.md',
      'part1/ch 02/README.md',
    ]);
  });

  it('strips anchors from links', () => {
    const summary = `- [Setup](ch02.md#setup)\n`;
    expect(parseSummaryLinks(summary)).toEqual(['ch02.md']);
  });

  it('ignores non-md links', () => {
    const summary = `- [Image](img/logo.png)\n- [Chapter](ch01.md)\n`;
    expect(parseSummaryLinks(summary)).toEqual(['ch01.md']);
  });
});
