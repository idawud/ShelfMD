export const WORKSPACE_KEY = 'shelfmd:workspace';

export type SidebarTab = 'outline' | 'files' | 'bookmarks';

export interface WorkspaceTab {
  filePath: string;
  scrollLine: number;
}

export interface WorkspaceState {
  tabs: WorkspaceTab[];
  activeIdx: number;
  activeBookId: number | null;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
}

const SIDEBAR_TABS: SidebarTab[] = ['outline', 'files', 'bookmarks'];

/** Snapshot open tabs; tabs without a file (the welcome page) are not persisted. */
export function buildWorkspace(
  tabs: Array<{ filePath: string | null; scrollLine: number }>,
  activeIdx: number,
  rest: Omit<WorkspaceState, 'tabs' | 'activeIdx'>,
): WorkspaceState {
  const kept: WorkspaceTab[] = [];
  let keptActive = 0;
  tabs.forEach((t, i) => {
    if (!t.filePath) return;
    if (i === activeIdx) keptActive = kept.length;
    kept.push({ filePath: t.filePath, scrollLine: t.scrollLine || 0 });
  });
  return { tabs: kept, activeIdx: keptActive, ...rest };
}

export function saveWorkspace(state: WorkspaceState) {
  try {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadWorkspace(): WorkspaceState | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.tabs)) return null;
    const tabs: WorkspaceTab[] = p.tabs
      .filter((t: any) => t && typeof t.filePath === 'string')
      .map((t: any) => ({
        filePath: t.filePath,
        scrollLine: Number.isFinite(t.scrollLine) ? t.scrollLine : 0,
      }));
    return {
      tabs,
      activeIdx: Number.isInteger(p.activeIdx) ? p.activeIdx : 0,
      activeBookId: typeof p.activeBookId === 'number' ? p.activeBookId : null,
      sidebarOpen: p.sidebarOpen !== false,
      sidebarTab: SIDEBAR_TABS.includes(p.sidebarTab) ? p.sidebarTab : 'outline',
    };
  } catch {
    return null;
  }
}
