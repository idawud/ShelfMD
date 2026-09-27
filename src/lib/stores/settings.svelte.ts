import { DEFAULT_SETTINGS, type ReaderSettings } from '$lib/types.js';

function createSettingsStore() {
  let settings = $state<ReaderSettings>({ ...DEFAULT_SETTINGS });

  // Load from localStorage on init
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('shelfmd:settings');
      if (saved) Object.assign(settings, JSON.parse(saved));
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
    reset() {
      Object.assign(settings, DEFAULT_SETTINGS);
      save();
    }
  };
}

export const settingsStore = createSettingsStore();
