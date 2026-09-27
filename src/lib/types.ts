export interface Heading {
  level: number;
  text: string;
  slug: string;
  line: number;
}

export interface Tab {
  id: string;
  filePath: string | null;
  title: string;
  content: string;
  isDirty: boolean;
  viewMode: 'rendered' | 'raw' | 'edit';
  scrollLine: number;
  draftContent?: string;
}

export interface ReaderSettings {
  theme: 'light' | 'dark' | 'sepia';
  fontFamily: string;
  fontSize: number; // px
  lineHeight: number;
  contentWidth: number; // ch
  zoom: number; // 1.0 = 100%
  lineNumbers: boolean;
  wordWrap: boolean;
  vimKeys: boolean;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontFamily: 'Georgia, serif',
  fontSize: 16,
  lineHeight: 1.75,
  contentWidth: 72,
  zoom: 1.0,
  lineNumbers: false,
  wordWrap: true,
  vimKeys: false,
};

export interface ResolveResult {
  resolved: string | null;
  anchor: string | null;
  link_type: 'md' | 'asset' | 'external' | 'broken';
}

export interface OpenFileResult {
  content: string;
  canonical_path: string;
  file_name: string;
}

export interface Progress {
  file_id: number;
  top_line: number;
  heading_slug: string | null;
  heading_text: string | null;
  percent: number;
  finished: boolean;
  view_mode: string;
  updated_at: string;
}

export interface Session {
  book_id: number;
  tabs_json: string;
  active_tab: number;
  sidebar_json: string;
  last_file_id: number | null;
}

export interface OpenWithMemoryResult {
  content: string;
  canonical_path: string;
  file_name: string;
  file_id: number;
  progress: Progress | null;
  content_changed: boolean;
}

export interface Bookmark {
  id: number;
  file_id: number;
  line: number;
  heading_text: string | null;
  label: string | null;
  note: string | null;
  created_at: string;
}

export interface BookmarkWithPath {
  bookmark: Bookmark;
  rel_path: string;
}

export interface ScanEntry {
  href: string;
  line: number;
  broken: boolean;
}
