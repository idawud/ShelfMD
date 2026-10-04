import { beforeEach, describe, expect, it } from 'vitest';
import { WORKSPACE_KEY, buildWorkspace, loadWorkspace, saveWorkspace } from './workspace.js';

const rest = { activeBookId: 3, sidebarOpen: true, sidebarTab: 'files' as const };

describe('workspace', () => {
  beforeEach(() => localStorage.clear());

  it('drops file-less tabs and remaps the active index', () => {
    const ws = buildWorkspace(
      [
        { filePath: null, scrollLine: 0 },
        { filePath: 'a.md', scrollLine: 5 },
        { filePath: 'b.md', scrollLine: 9 },
      ],
      2,
      rest,
    );
    expect(ws.tabs.map(t => t.filePath)).toEqual(['a.md', 'b.md']);
    expect(ws.activeIdx).toBe(1);
  });

  it('round-trips through localStorage', () => {
    const ws = buildWorkspace([{ filePath: 'a.md', scrollLine: 42 }], 0, rest);
    saveWorkspace(ws);
    expect(loadWorkspace()).toEqual(ws);
  });

  it('returns null when nothing or garbage is stored', () => {
    expect(loadWorkspace()).toBeNull();
    localStorage.setItem(WORKSPACE_KEY, '{not json');
    expect(loadWorkspace()).toBeNull();
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ tabs: 'x' }));
    expect(loadWorkspace()).toBeNull();
  });

  it('sanitizes bad fields', () => {
    localStorage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({ tabs: [{ filePath: 'a.md', scrollLine: 'x' }, { nope: 1 }], sidebarTab: 'zzz' }),
    );
    const ws = loadWorkspace()!;
    expect(ws.tabs).toEqual([{ filePath: 'a.md', scrollLine: 0 }]);
    expect(ws.sidebarTab).toBe('outline');
    expect(ws.activeBookId).toBeNull();
  });
});
