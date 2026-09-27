import type { Tab } from '$lib/types.js';

function createTabStore() {
  let tabs = $state<Tab[]>([]);
  let activeIdx = $state(0);

  function newTab(partial?: Partial<Tab>): Tab {
    return {
      id: crypto.randomUUID(),
      filePath: null,
      title: 'Untitled',
      content: '',
      isDirty: false,
      viewMode: 'rendered',
      scrollLine: 0,
      ...partial,
    };
  }

  return {
    get tabs() { return tabs; },
    get activeIdx() { return activeIdx; },
    get active() { return tabs[activeIdx] ?? null; },

    open(partial?: Partial<Tab>) {
      const tab = newTab(partial);
      tabs.push(tab);
      activeIdx = tabs.length - 1;
      return tab;
    },

    close(id: string) {
      const idx = tabs.findIndex(t => t.id === id);
      if (idx === -1) return;
      tabs.splice(idx, 1);
      if (tabs.length === 0) {
        tabs.push(newTab());
        activeIdx = 0;
      } else {
        activeIdx = Math.min(activeIdx, tabs.length - 1);
      }
    },

    activate(id: string) {
      const idx = tabs.findIndex(t => t.id === id);
      if (idx !== -1) activeIdx = idx;
    },

    activateByIndex(n: number) {
      if (n >= 0 && n < tabs.length) activeIdx = n;
    },

    update(id: string, patch: Partial<Tab>) {
      const tab = tabs.find(t => t.id === id);
      if (tab) Object.assign(tab, patch);
    },

    init() {
      if (tabs.length === 0) tabs.push(newTab());
    }
  };
}

export const tabStore = createTabStore();
