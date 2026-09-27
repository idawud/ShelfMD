import { invoke } from '@tauri-apps/api/core';
import type { ResolveResult } from '$lib/types.js';

export type NavigationCallback = (filePath: string, anchor?: string, newTab?: boolean) => void;
export type ToastCallback = (message: string, type?: 'info' | 'error' | 'warning') => void;
export type StatusCallback = (text: string) => void;

/**
 * LNK-01: Create a delegated click handler for all links in rendered Markdown.
 * Attach to the reader container.
 */
export function createLinkHandler(opts: {
  currentFile: string | null;
  bookRoot: string | null;
  onNavigate: NavigationCallback;
  onToast: ToastCallback;
  onStatus?: StatusCallback;
}): (e: MouseEvent) => void {
  const { currentFile, bookRoot, onNavigate, onToast } = opts;

  return async (e: MouseEvent) => {
    // LNK-01: delegated — find closest anchor
    const target = e.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href') ?? '';
    if (!href) return;

    // LNK-13: external URLs open in browser, never in-app
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      // Default browser handling — don't preventDefault
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // LNK-10: middle-click or Ctrl+Click = new tab
    const newTab = e.ctrlKey || e.metaKey || e.button === 1;

    if (!currentFile && !href.startsWith('#')) {
      onToast('Open a file first to follow links', 'warning');
      return;
    }

    try {
      const result = await invoke<ResolveResult>('resolve_link', {
        currentFile: currentFile ?? '',
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
          // LNK-12: non-Markdown local files open in Windows default app
          if (result.resolved) {
            await invoke('open_path_externally', { path: result.resolved });
          }
          break;
        case 'external':
          // LNK-14: out-of-book files — warn but open
          if (result.resolved) {
            await invoke('open_path_externally', { path: result.resolved });
          }
          break;
        case 'broken':
          // LNK-15: broken link toast
          onToast(`Not found: ${href}`, 'error');
          break;
      }
    } catch (err) {
      console.error('Link navigation error:', err);
      onToast(`Link error: ${String(err)}`, 'error');
    }
  };
}

/**
 * LNK-16: Create a mouseover handler to show resolved path in status bar.
 */
export function createHoverHandler(opts: {
  currentFile: string | null;
  bookRoot: string | null;
  onStatus: StatusCallback;
}): { over: (e: MouseEvent) => void; out: () => void } {
  const { currentFile, bookRoot, onStatus } = opts;
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  const over = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[data-internal]') as HTMLAnchorElement | null;
    if (!anchor || !currentFile) { onStatus(''); return; }

    const href = anchor.getAttribute('href') ?? '';

    // Show resolved path after short delay
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(async () => {
      try {
        const result = await invoke<ResolveResult>('resolve_link', {
          currentFile,
          href,
          bookRoot,
        });
        const display = result.resolved ?? href;
        onStatus(result.link_type === 'broken' ? `\u26a0 Not found: ${href}` : display);
      } catch {
        onStatus(href);
      }
    }, 50);
  };

  const out = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    onStatus('');
  };

  return { over, out };
}

/**
 * LNK-15: Post-process rendered HTML container to mark broken links.
 * Calls resolve_link for each internal link and adds broken-link class if missing.
 */
export async function markBrokenLinks(
  container: HTMLElement,
  currentFile: string,
  bookRoot: string | null
): Promise<void> {
  const anchors = container.querySelectorAll<HTMLAnchorElement>('a[data-internal]');
  await Promise.all(Array.from(anchors).map(async (anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    if (!href || href.startsWith('#')) return; // same-page anchors always valid in context
    try {
      const result = await invoke<ResolveResult>('resolve_link', {
        currentFile,
        href,
        bookRoot,
      });
      if (result.link_type === 'broken') {
        anchor.classList.add('broken-link');
        anchor.setAttribute('data-broken', 'true');
        anchor.title = `Not found: ${href}`;
      } else if (result.link_type === 'external') {
        anchor.setAttribute('data-external-file', 'true');
        anchor.title = `External: ${result.resolved ?? href}`;
      }
    } catch {
      // ignore — broken link marking is best-effort
    }
  }));
}

/**
 * LNK-17: Rewrite relative image src attributes using resolve_link.
 */
export async function rewriteImagePaths(
  container: HTMLElement,
  currentFile: string,
  bookRoot: string | null
): Promise<void> {
  const images = container.querySelectorAll<HTMLImageElement>('img[data-lightbox]');
  await Promise.all(Array.from(images).map(async (img) => {
    const src = img.getAttribute('src') ?? '';
    // Skip already-absolute paths
    if (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) return;
    try {
      const result = await invoke<ResolveResult>('resolve_link', {
        currentFile,
        href: src,
        bookRoot,
      });
      if (result.resolved && result.link_type === 'asset') {
        // Use Tauri asset protocol
        img.src = `asset://localhost/${encodeURIComponent(result.resolved)}`;
      }
    } catch {
      // leave as-is
    }
  }));
}
