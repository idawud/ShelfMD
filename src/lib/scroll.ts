/**
 * Maps source lines (from data-sourcepos) to rendered element scroll positions.
 * Used for reading memory (MEM-01) and view sync (RDR-16).
 */

export interface ScrollPosition {
  line: number;
  percent: number;
  headingSlug: string | null;
  headingText: string | null;
}

/**
 * Get current reading position from a rendered container element.
 */
export function getScrollPosition(container: HTMLElement): ScrollPosition {
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight - container.clientHeight;
  const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) / 100 : 0;

  // Find the topmost block element with data-sourcepos
  let topLine = 0;
  let headingSlug: string | null = null;
  let headingText: string | null = null;

  const elements = container.querySelectorAll<HTMLElement>('[data-sourcepos]');
  let closest: HTMLElement | null = null;
  let closestDist = Infinity;

  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relativeTop = rect.top - containerRect.top;

    // Find element closest to (but not below) top of viewport
    if (relativeTop <= 10 && Math.abs(relativeTop) < closestDist) {
      closestDist = Math.abs(relativeTop);
      closest = el;
    }
  }

  if (closest) {
    const sp = closest.getAttribute('data-sourcepos') ?? '0:0';
    topLine = parseInt(sp.split(':')[0], 10);
  }

  // Find last heading above viewport top
  const headings = container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
  for (const h of headings) {
    const rect = h.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (rect.top - containerRect.top <= 20) {
      headingSlug = h.id;
      headingText = h.textContent ?? null;
    }
  }

  return { line: topLine, percent, headingSlug, headingText };
}

/**
 * Scroll container to a given source line.
 */
export function scrollToLine(container: HTMLElement, line: number): void {
  const elements = container.querySelectorAll<HTMLElement>('[data-sourcepos]');
  let best: HTMLElement | null = null;
  let bestLine = -1;

  for (const el of elements) {
    const sp = el.getAttribute('data-sourcepos') ?? '';
    const l = parseInt(sp.split(':')[0], 10);
    if (l <= line && l > bestLine) {
      bestLine = l;
      best = el;
    }
  }

  if (best) {
    best.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Scroll to a heading by slug.
 */
export function scrollToSlug(container: HTMLElement, slug: string): boolean {
  const el = container.querySelector<HTMLElement>(`#${CSS.escape(slug)}, [name="${CSS.escape(slug)}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  return false;
}
