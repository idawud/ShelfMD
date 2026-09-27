import { describe, it, expect, vi } from 'vitest';
import { createLinkHandler } from './links.js';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args: Record<string, unknown>) => {
    if (cmd === 'resolve_link') {
      const href = args['href'] as string;
      if (href.startsWith('https://') || href.startsWith('http://')) {
        return { resolved: href, anchor: null, link_type: 'external' };
      }
      if (href.includes('missing')) {
        return { resolved: null, anchor: null, link_type: 'broken' };
      }
      if (href.includes('#')) {
        const [path, anchor] = href.split('#');
        return { resolved: `/book/${path}`, anchor, link_type: 'md' };
      }
      return { resolved: `/book/${href}`, anchor: null, link_type: 'md' };
    }
    return null;
  }),
}));

function makeAnchor(href: string, internal = true): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.setAttribute('href', href);
  if (internal) a.setAttribute('data-internal', 'true');
  return a;
}

function makeClickEvent(target: Element, opts: { ctrl?: boolean; button?: number } = {}): MouseEvent {
  return {
    target,
    ctrlKey: opts.ctrl ?? false,
    metaKey: false,
    button: opts.button ?? 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as MouseEvent;
}

describe('createLinkHandler', () => {
  it('calls onNavigate for internal md links', async () => {
    const onNavigate = vi.fn();
    const onToast = vi.fn();
    const handler = createLinkHandler({
      currentFile: '/book/ch01.md',
      bookRoot: '/book',
      onNavigate,
      onToast,
    });

    const a = makeAnchor('ch02.md');
    const e = makeClickEvent(a);
    await handler(e);

    expect(onNavigate).toHaveBeenCalledWith('/book/ch02.md', undefined, false);
  });

  it('shows toast for broken links', async () => {
    const onNavigate = vi.fn();
    const onToast = vi.fn();
    const handler = createLinkHandler({
      currentFile: '/book/ch01.md',
      bookRoot: '/book',
      onNavigate,
      onToast,
    });

    const a = makeAnchor('missing-file.md');
    const e = makeClickEvent(a);
    await handler(e);

    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('Not found'), 'error');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('opens new tab on ctrl+click', async () => {
    const onNavigate = vi.fn();
    const onToast = vi.fn();
    const handler = createLinkHandler({
      currentFile: '/book/ch01.md',
      bookRoot: '/book',
      onNavigate,
      onToast,
    });

    const a = makeAnchor('ch02.md');
    const e = makeClickEvent(a, { ctrl: true });
    await handler(e);

    expect(onNavigate).toHaveBeenCalledWith('/book/ch02.md', undefined, true);
  });

  it('does not intercept external http links', async () => {
    const onNavigate = vi.fn();
    const onToast = vi.fn();
    const handler = createLinkHandler({
      currentFile: '/book/ch01.md',
      bookRoot: '/book',
      onNavigate,
      onToast,
    });

    const a = makeAnchor('https://example.com', false);
    const e = makeClickEvent(a);
    await handler(e);

    // External links pass through — handler returns without calling onNavigate
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
