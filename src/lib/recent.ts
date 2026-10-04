import { loadWorkspace } from '$lib/workspace.js';

export const RECENT_KEY = 'shelfmd:recent';
export const MAX_RECENT = 20;

export interface RecentFile {
  filePath: string;
  title: string;
  openedAt: number;
  /** True when the file is open in the saved workspace. */
  saved?: boolean;
}

export function loadRecents(): RecentFile[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    return p
      .filter((r: any) => r && typeof r.filePath === 'string')
      .map((r: any) => ({
        filePath: r.filePath,
        title: typeof r.title === 'string' ? r.title : r.filePath,
        openedAt: Number.isFinite(r.openedAt) ? r.openedAt : 0,
      }));
  } catch {
    return [];
  }
}

/** Record a file as just opened: moves it to the front, de-duplicates, caps the list. */
export function addRecent(filePath: string, title: string, now = Date.now()): RecentFile[] {
  const key = (p: string) => p.replace(/\\/g, '/').toLowerCase();
  const next = [
    { filePath, title, openedAt: now },
    ...loadRecents().filter(r => key(r.filePath) !== key(filePath)),
  ].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

/** Recent files, newest first, flagged when they are part of the saved workspace. */
export function recentWithSaved(): RecentFile[] {
  const key = (p: string) => p.replace(/\\/g, '/').toLowerCase();
  const savedPaths = new Set((loadWorkspace()?.tabs ?? []).flatMap(t => (t.filePath ? [key(t.filePath)] : [])),
  );
  return loadRecents()
    .sort((a, b) => b.openedAt - a.openedAt)
    .map(r => ({ ...r, saved: savedPaths.has(key(r.filePath)) }));
}
