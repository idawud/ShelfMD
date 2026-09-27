export type ShortcutAction =
  | 'scroll-down' | 'scroll-up' | 'scroll-top' | 'scroll-bottom'
  | 'scroll-half-down' | 'scroll-half-up'
  | 'heading-prev' | 'heading-next'
  | 'find' | 'find-close'
  | 'new-tab' | 'close-tab'
  | 'tab-1' | 'tab-2' | 'tab-3' | 'tab-4' | 'tab-5' | 'tab-6' | 'tab-7' | 'tab-8' | 'tab-9'
  | 'zoom-in' | 'zoom-out' | 'zoom-reset'
  | 'zen-toggle'
  | 'raw-toggle'
  | 'edit-toggle'
  | 'save'
  | 'open-file'
  | 'paste-mode'
  | 'sidebar-toggle'
  | 'nav-back' | 'nav-forward'
  | 'copy-rich' | 'copy-raw';

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export type KeyMap = Record<ShortcutAction, KeyBinding[]>;

export const DEFAULT_KEYMAP: KeyMap = {
  'scroll-down':      [{ key: 'j' }, { key: 'ArrowDown' }],
  'scroll-up':        [{ key: 'k' }, { key: 'ArrowUp' }],
  'scroll-top':       [{ key: 'g' }],
  'scroll-bottom':    [{ key: 'G', shift: true }],
  'scroll-half-down': [{ key: 'd', ctrl: true }],
  'scroll-half-up':   [{ key: 'u', ctrl: true }],
  'heading-prev':     [{ key: '[' }],
  'heading-next':     [{ key: ']' }],
  'find':             [{ key: 'f', ctrl: true }],
  'find-close':       [{ key: 'Escape' }],
  'new-tab':          [{ key: 't', ctrl: true }],
  'close-tab':        [{ key: 'w', ctrl: true }],
  'tab-1':            [{ key: '1', ctrl: true }],
  'tab-2':            [{ key: '2', ctrl: true }],
  'tab-3':            [{ key: '3', ctrl: true }],
  'tab-4':            [{ key: '4', ctrl: true }],
  'tab-5':            [{ key: '5', ctrl: true }],
  'tab-6':            [{ key: '6', ctrl: true }],
  'tab-7':            [{ key: '7', ctrl: true }],
  'tab-8':            [{ key: '8', ctrl: true }],
  'tab-9':            [{ key: '9', ctrl: true }],
  'zoom-in':          [{ key: '=', ctrl: true }, { key: '+', ctrl: true }],
  'zoom-out':         [{ key: '-', ctrl: true }],
  'zoom-reset':       [{ key: '0', ctrl: true }],
  'zen-toggle':       [{ key: 'F11' }, { key: 'z', ctrl: true, shift: true }],
  'raw-toggle':       [{ key: 'u', ctrl: true }],
  'edit-toggle':      [{ key: 'e', ctrl: true }],
  'save':             [{ key: 's', ctrl: true }],
  'open-file':        [{ key: 'o', ctrl: true }],
  'paste-mode':       [{ key: 'v', ctrl: true, shift: true }],
  'sidebar-toggle':   [{ key: 'b', ctrl: true }],
  'nav-back':         [{ key: 'ArrowLeft', alt: true }, { key: 'Backspace' }],
  'nav-forward':      [{ key: 'ArrowRight', alt: true }],
  'copy-rich':        [],
  'copy-raw':         [],
};

function matchesBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
  return (
    e.key === binding.key &&
    !!e.ctrlKey === !!binding.ctrl &&
    !!e.shiftKey === !!binding.shift &&
    !!e.altKey === !!binding.alt &&
    !!e.metaKey === !!binding.meta
  );
}

export function matchShortcut(e: KeyboardEvent, keymap: KeyMap = DEFAULT_KEYMAP): ShortcutAction | null {
  for (const [action, bindings] of Object.entries(keymap) as [ShortcutAction, KeyBinding[]][]) {
    for (const binding of bindings) {
      if (matchesBinding(e, binding)) return action;
    }
  }
  return null;
}
