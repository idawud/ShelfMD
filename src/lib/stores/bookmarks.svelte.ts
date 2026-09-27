import { invoke } from '@tauri-apps/api/core';
import type { Bookmark, BookmarkWithPath } from '$lib/types.js';

function createBookmarksStore() {
  let fileBookmarks = $state<Bookmark[]>([]);
  let bookBookmarks = $state<BookmarkWithPath[]>([]);
  let currentFileId = $state<number | null>(null);

  async function loadFile(fileId: number) {
    currentFileId = fileId;
    try {
      fileBookmarks = await invoke<Bookmark[]>('list_bookmarks', { fileId });
    } catch {
      fileBookmarks = [];
    }
  }

  async function loadBook(bookId: number) {
    try {
      bookBookmarks = await invoke<BookmarkWithPath[]>('list_book_bookmarks', { bookId });
    } catch {
      bookBookmarks = [];
    }
  }

  async function add(
    fileId: number,
    line: number,
    headingText: string | null,
    label: string | null
  ): Promise<number> {
    const id = await invoke<number>('add_bookmark', {
      fileId,
      line,
      headingText,
      label,
      note: null,
    });
    if (currentFileId === fileId) {
      fileBookmarks = await invoke<Bookmark[]>('list_bookmarks', { fileId });
    }
    return id;
  }

  async function remove(id: number) {
    await invoke('remove_bookmark', { id });
    fileBookmarks = fileBookmarks.filter(b => b.id !== id);
    bookBookmarks = bookBookmarks.filter(b => b.bookmark.id !== id);
  }

  return {
    get fileBookmarks() { return fileBookmarks; },
    get bookBookmarks() { return bookBookmarks; },
    get currentFileId() { return currentFileId; },
    loadFile,
    loadBook,
    add,
    remove,
  };
}

export const bookmarksStore = createBookmarksStore();
