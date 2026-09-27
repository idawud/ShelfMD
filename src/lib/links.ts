import { invoke } from '@tauri-apps/api/core';
import type { ResolveResult } from '$lib/types.js';

export type NavigationCallback = (filePath: string, anchor?: string, newTab?: boolean) => void;
export type ToastCallback = (message: string, type?: 'info' | 'error' | 'warning') => void;

/**
 * Create a delegated click handler for links in rendered Markdown.
 * Attach to the reader container with addEventListener('click', handler).
 */
export function createLinkHandler(
  currentFile: string | null,
  bookRoot: string | null,
  onNavigate: NavigationCallback,
  onToast: ToastCallback
): (e: MouseEvent) => void {
  return async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[data-internal]') as HTMLAnchorElement | null;
    if (!anchor) return;

    e.preventDefault();
    e.stopPropagation();

    const href = anchor.getAttribute('href') ?? '';
    if (!href) return;

    const newTab = e.ctrlKey || e.metaKey || e.button === 1;

    if (!currentFile) {
      onToast('Open a file first', 'warning');
      return;
    }

    try {
      const result = await invoke<ResolveResult>('resolve_link', {
        currentFile,
        href,
        bookRoot,
      });

      switch (result.link_type) {
        case 'md':
          if (result.resolved) {
            onNavigate(result.resolved, result.anchor ?? undefined, newTab);
          }
          break;
        case 'asset':
          if (result.resolved) {
            await invoke('open_path_externally', { path: result.resolved });
          }
          break;
        case 'external':
          if (result.resolved) {
            await invoke('open_url_externally', { url: result.resolved });
          }
          break;
        case 'broken':
          onToast(`Not found: ${href}`, 'error');
          break;
      }
    } catch (err) {
      onToast(`Link error: ${err}`, 'error');
    }
  };
}
