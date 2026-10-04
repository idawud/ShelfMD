import { DEFAULT_SETTINGS, type ReaderSettings, type Theme } from '$lib/types.js';

function createSettingsStore() {
  let settings = $state<ReaderSettings>({ ...DEFAULT_SETTINGS, textColors: {} });

  // Load from localStorage on init
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('shelfmd:settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(settings, parsed);
        // Settings saved before per-theme text colors existed have no textColors
        if (!parsed.textColors || typeof parsed.textColors !== 'object') settings.textColors = {};
      }
    } catch {}
  }

  function save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shelfmd:settings', JSON.stringify(settings));
    }
  }

  return {
    get value() { return settings; },
    update(patch: Partial<ReaderSettings>) {
      Object.assign(settings, patch);
      save();
    },
    setTextColor(theme: Theme, color: string) {
      settings.textColors = { ...settings.textColors, [theme]: color };
      save();
    },
    resetTextColor(theme: Theme) {
      const { [theme]: _, ...rest } = settings.textColors;
      settings.textColors = rest;
      save();
    },
    reset() {
      Object.assign(settings, DEFAULT_SETTINGS, { textColors: {} });
      save();
    }
  };
}

export const settingsStore = createSettingsStore();
