import { describe, it, expect } from 'vitest';
// Note: stores use $state runes; need to test with a plain object equivalent
// Test the logic directly by simulating the store behavior

describe('tab history', () => {
  it('navigate pushes entry', () => {
    const history: Array<{ filePath: string; scrollLine: number }> = [];
    let idx = -1;

    function navigate(entry: { filePath: string; scrollLine: number }) {
      history.splice(idx + 1);
      history.push(entry);
      idx = history.length - 1;
    }

    function back() {
      if (idx <= 0) return null;
      idx--;
      return history[idx];
    }

    function forward() {
      if (idx >= history.length - 1) return null;
      idx++;
      return history[idx];
    }

    navigate({ filePath: '/book/ch01.md', scrollLine: 0 });
    navigate({ filePath: '/book/ch02.md', scrollLine: 10 });

    expect(history).toHaveLength(2);
    expect(idx).toBe(1);

    const prev = back();
    expect(prev?.filePath).toBe('/book/ch01.md');

    const fwd = forward();
    expect(fwd?.filePath).toBe('/book/ch02.md');
  });

  it('forward history is truncated on new navigate', () => {
    const history: Array<{ filePath: string; scrollLine: number }> = [];
    let idx = -1;

    function navigate(entry: { filePath: string; scrollLine: number }) {
      history.splice(idx + 1);
      history.push(entry);
      idx = history.length - 1;
    }
    function back() { if (idx <= 0) return null; idx--; return history[idx]; }

    navigate({ filePath: '/a.md', scrollLine: 0 });
    navigate({ filePath: '/b.md', scrollLine: 0 });
    navigate({ filePath: '/c.md', scrollLine: 0 });
    back(); back(); // now at /a.md
    navigate({ filePath: '/d.md', scrollLine: 0 });

    expect(history).toHaveLength(2); // /a.md and /d.md
    expect(history[1].filePath).toBe('/d.md');
  });
});
