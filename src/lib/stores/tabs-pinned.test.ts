import { describe, it, expect } from 'vitest';
import { tabStore } from './tabs.svelte.js';

describe('pinned Welcome tab', () => {
  it('init creates a pinned Welcome tab that cannot be closed', () => {
    tabStore.init();
    const welcome = tabStore.tabs[0];
    expect(welcome.pinned).toBe(true);
    expect(welcome.title).toBe('Welcome');

    tabStore.close(welcome.id);
    expect(tabStore.tabs[0].id).toBe(welcome.id);
  });

  it('closes ordinary tabs and leaves the Welcome tab', () => {
    tabStore.init();
    const welcome = tabStore.tabs[0];
    const doc = tabStore.open({ filePath: 'a.md', title: 'a.md' });
    expect(tabStore.active?.id).toBe(doc.id);

    tabStore.close(doc.id);
    expect(tabStore.tabs.map(t => t.id)).toEqual([welcome.id]);
  });
});
