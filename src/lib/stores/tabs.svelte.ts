import type { Tab } from '$lib/types.js';

export interface HistoryEntry {
  filePath: string;
  anchor?: string;
  scrollLine: number;
}

export interface TabWithHistory extends Tab {
  history: HistoryEntry[];
  historyIdx: number; // current position in history
}

function createTabStore() {
  let tabs = $state<TabWithHistory[]>([]);
  let activeIdx = $state(0);

  function newTab(partial?: Partial<Tab>): TabWithHistory {
    return {
      id: crypto.randomUUID(),
      filePath: null,
      title: 'Untitled',
      content: '',
      isDirty: false,
      viewMode: 'rendered',
      scrollLine: 0,
      history: [],
      historyIdx: -1,
      ...partial,
    };
  }

  return {
    get tabs() { return tabs; },
    get activeIdx() { return activeIdx; },
    get active() { return tabs[activeIdx] ?? null; },

    open(partial?: Partial<Tab>): TabWithHistory {
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

    update(id: string, patch: Partial<TabWithHistory>) {
      const tab = tabs.find(t => t.id === id);
      if (tab) Object.assign(tab, patch);
    },

    /** LNK-18: Navigate within a tab, pushing to history */
    navigate(id: string, entry: HistoryEntry) {
      const tab = tabs.find(t => t.id === id);
      if (!tab) return;
      // Truncate forward history
      tab.history = tab.history.slice(0, tab.historyIdx + 1);
      // Cap at 50 entries (LNK-20)
      if (tab.history.length >= 50) tab.history.shift();
      tab.history.push(entry);
      tab.historyIdx = tab.history.length - 1;
      tab.filePath = entry.filePath;
      tab.scrollLine = entry.scrollLine;
    },

    /** LNK-19: Go back in tab history. Returns the entry to restore, or null. */
    back(id: string): HistoryEntry | null {
      const tab = tabs.find(t => t.id === id);
      if (!tab || tab.historyIdx <= 0) return null;
      tab.historyIdx--;
      const entry = tab.history[tab.historyIdx];
      tab.filePath = entry.filePath;
      tab.scrollLine = entry.scrollLine;
      return entry;
    },

    /** LNK-19: Go forward in tab history. Returns the entry to restore, or null. */
    forward(id: string): HistoryEntry | null {
      const tab = tabs.find(t => t.id === id);
      if (!tab || tab.historyIdx >= tab.history.length - 1) return null;
      tab.historyIdx++;
      const entry = tab.history[tab.historyIdx];
      tab.filePath = entry.filePath;
      tab.scrollLine = entry.scrollLine;
      return entry;
    },

    canBack(id: string): boolean {
      const tab = tabs.find(t => t.id === id);
      return !!tab && tab.historyIdx > 0;
    },

    canForward(id: string): boolean {
      const tab = tabs.find(t => t.id === id);
      return !!tab && tab.historyIdx < tab.history.length - 1;
    },

    /** LNK-11: Find an existing tab by file path */
    findByPath(filePath: string): TabWithHistory | null {
      return tabs.find(t => t.filePath === filePath) ?? null;
    },

    init() {
      if (tabs.length === 0) tabs.push(newTab());
    }
  };
}

export const tabStore = createTabStore();
