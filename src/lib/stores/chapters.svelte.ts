import { invoke } from '@tauri-apps/api/core';

/** Pure helper — exported for testing */
export function findAdjacentChapters(
  chapters: string[],
  currentPath: string
): { prev: string | null; next: string | null } {
  const idx = chapters.indexOf(currentPath);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? chapters[idx - 1] : null,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : null,
  };
}

function createChaptersStore() {
  let chapters = $state<string[]>([]);
  let bookRoot = $state<string | null>(null);

  async function loadBook(root: string) {
    bookRoot = root;
    try {
      chapters = await invoke<string[]>('get_reading_order', { bookRoot: root });
    } catch {
      chapters = [];
    }
  }

  function adjacent(currentPath: string) {
    return findAdjacentChapters(chapters, currentPath);
  }

  return {
    get chapters() { return chapters; },
    get bookRoot() { return bookRoot; },
    loadBook,
    adjacent,
  };
}

export const chaptersStore = createChaptersStore();
