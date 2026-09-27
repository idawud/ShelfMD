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
