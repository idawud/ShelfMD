import { invoke } from '@tauri-apps/api/core';
import { getScrollPosition } from '$lib/scroll.js';
import type { Progress } from '$lib/types.js';

export interface ProgressStore {
  save(fileId: number, container: HTMLElement, viewMode?: string): Promise<void>;
  load(fileId: number): Promise<Progress | null>;
  markFinished(fileId: number, finished: boolean): Promise<void>;
  startDebounce(fileId: number, container: HTMLElement): () => void;
}

export function createProgressStore(): ProgressStore {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  async function save(fileId: number, container: HTMLElement, viewMode = 'rendered') {
    const pos = getScrollPosition(container);
    const progress: Progress = {
      file_id: fileId,
      top_line: pos.line,
      heading_slug: pos.headingSlug,
      heading_text: pos.headingText,
      percent: pos.percent,
      finished: pos.percent >= 0.95,
      view_mode: viewMode,
      updated_at: '',
    };
    try {
      await invoke('set_progress', { progress });
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  async function load(fileId: number): Promise<Progress | null> {
    try {
      return await invoke<Progress | null>('get_progress', { fileId });
    } catch {
      return null;
    }
  }

  async function markFinished(fileId: number, finished: boolean) {
    try {
      await invoke('mark_file_finished', { fileId, finished });
    } catch (e) {
      console.warn('Failed to mark finished:', e);
    }
  }

  /** MEM-03: Start a debounced save loop. Returns a cleanup function. */
  function startDebounce(fileId: number, container: HTMLElement): () => void {
    function scheduleNext() {
      saveTimer = setTimeout(async () => {
        await save(fileId, container);
        scheduleNext();
      }, 2000); // MEM-03: save at most every 2s
    }
    scheduleNext();
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }

  return { save, load, markFinished, startDebounce };
}

export const progressStore = createProgressStore();
