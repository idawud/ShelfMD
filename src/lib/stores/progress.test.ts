import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, _args: unknown) => {
    if (cmd === 'set_progress') return null;
    if (cmd === 'get_progress') return null;
    if (cmd === 'mark_file_finished') return null;
    return null;
  }),
}));

// Mock scroll
vi.mock('$lib/scroll.js', () => ({
  getScrollPosition: vi.fn(() => ({
    line: 42,
    percent: 0.62,
    headingSlug: 'setup',
    headingText: 'Setup',
  })),
}));

import { createProgressStore } from './progress.svelte.js';
import { invoke } from '@tauri-apps/api/core';

describe('progressStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('save calls set_progress with scroll position', async () => {
    const store = createProgressStore();
    const container = document.createElement('div');
    await store.save(42, container);
    expect(invoke).toHaveBeenCalledWith('set_progress', expect.objectContaining({
      progress: expect.objectContaining({
        file_id: 42,
        top_line: 42,
        percent: 0.62,
        heading_slug: 'setup',
      }),
    }));
  });

  it('load calls get_progress', async () => {
    const store = createProgressStore();
    await store.load(99);
    expect(invoke).toHaveBeenCalledWith('get_progress', { fileId: 99 });
  });

  it('markFinished calls mark_file_finished', async () => {
    const store = createProgressStore();
    await store.markFinished(77, true);
    expect(invoke).toHaveBeenCalledWith('mark_file_finished', { fileId: 77, finished: true });
  });

  it('debounce cleanup stops timer', () => {
    const store = createProgressStore();
    const container = document.createElement('div');
    const stop = store.startDebounce(1, container);
    expect(typeof stop).toBe('function');
    stop(); // should not throw
  });
});
