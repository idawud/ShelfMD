import { invoke } from '@tauri-apps/api/core';

export interface Book {
  id: number;
  name: string;
  root_path: string;
  tags: string;
  pinned: boolean;
  cover: string | null;
  added_at: string;
  last_opened_at: string | null;
  settings_json: string;
}

export interface BookWithStatus {
  book: Book;
  exists: boolean;
}

export function createLibraryStore() {
  let books = $state<BookWithStatus[]>([]);
  let activeBookId = $state<number | null>(null);
  let loading = $state(false);

  return {
    get books() { return books; },
    get activeBookId() { return activeBookId; },
    get activeBook() { return books.find(b => b.book.id === activeBookId) ?? null; },
    get loading() { return loading; },

    async load() {
      loading = true;
      try {
        books = await invoke<BookWithStatus[]>('list_books_cmd');
      } finally {
        loading = false;
      }
    },

    async addBook(rootPath: string): Promise<Book> {
      const book = await invoke<Book>('add_book_cmd', { rootPath });
      await this.load();
      return book;
    },

    async removeBook(bookId: number, deleteProgress: boolean) {
      await invoke('remove_book_cmd', { bookId, deleteProgress });
      if (activeBookId === bookId) activeBookId = null;
      await this.load();
    },

    async updateBook(bookId: number, name: string, tags: string) {
      await invoke('update_book_cmd', { bookId, name, tags, settingsJson: '{}' });
      await this.load();
    },

    async relocate(bookId: number, newRoot: string) {
      await invoke('relocate_book', { bookId, newRoot });
      await this.load();
    },

    setActive(bookId: number | null) {
      activeBookId = bookId;
      if (bookId !== null) invoke('touch_book', { bookId }).catch(() => {});
    },
  };
}

export const libraryStore = createLibraryStore();
