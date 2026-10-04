import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_RECENT, addRecent, loadRecents, recentWithSaved } from './recent.js';
import { buildWorkspace, saveWorkspace } from './workspace.js';

describe('recent files', () => {
  beforeEach(() => localStorage.clear());

  it('puts the newest file first and de-duplicates by path', () => {
    addRecent('C:\\book\\a.md', 'A', 1);
    addRecent('C:\\book\\b.md', 'B', 2);
    addRecent('c:/book/A.md', 'A again', 3);
    expect(loadRecents().map(r => r.title)).toEqual(['A again', 'B']);
  });

  it('caps the list', () => {
    for (let i = 0; i < MAX_RECENT + 5; i++) addRecent(`f${i}.md`, `F${i}`, i);
    expect(loadRecents()).toHaveLength(MAX_RECENT);
  });

  it('flags files that are in the saved workspace', () => {
    addRecent('a.md', 'A', 1);
    addRecent('b.md', 'B', 2);
    saveWorkspace(
      buildWorkspace([{ filePath: 'a.md', scrollLine: 0 }], 0, {
        activeBookId: null,
        sidebarOpen: true,
        sidebarTab: 'outline',
      }),
    );
    const list = recentWithSaved();
    expect(list.map(r => [r.title, r.saved])).toEqual([['B', false], ['A', true]]);
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('shelfmd:recent', 'oops');
    expect(loadRecents()).toEqual([]);
  });
});
