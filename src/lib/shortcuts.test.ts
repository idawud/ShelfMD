import { describe, it, expect } from 'vitest';
import { matchShortcut, DEFAULT_KEYMAP } from './shortcuts.js';

function mockEvent(key: string, opts: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}): KeyboardEvent {
  return {
    key,
    ctrlKey: opts.ctrl ?? false,
    shiftKey: opts.shift ?? false,
    altKey: opts.alt ?? false,
    metaKey: false,
  } as KeyboardEvent;
}

describe('matchShortcut', () => {
  it('matches vim j/k scroll', () => {
    expect(matchShortcut(mockEvent('j'))).toBe('scroll-down');
    expect(matchShortcut(mockEvent('k'))).toBe('scroll-up');
  });

  it('matches Ctrl+F for find', () => {
    expect(matchShortcut(mockEvent('f', { ctrl: true }))).toBe('find');
  });

  it('matches Ctrl+T for new tab', () => {
    expect(matchShortcut(mockEvent('t', { ctrl: true }))).toBe('new-tab');
  });

  it('matches F11 for zen toggle', () => {
    expect(matchShortcut(mockEvent('F11'))).toBe('zen-toggle');
  });

  it('matches Alt+Left for nav-back', () => {
    expect(matchShortcut(mockEvent('ArrowLeft', { alt: true }))).toBe('nav-back');
  });

  it('returns null for unknown keys', () => {
    expect(matchShortcut(mockEvent('z'))).toBeNull();
    expect(matchShortcut(mockEvent('x', { ctrl: true }))).toBeNull();
  });

  it('matches G (shift) for scroll-bottom', () => {
    expect(matchShortcut(mockEvent('G', { shift: true }))).toBe('scroll-bottom');
  });

  it('matches Ctrl+W for close-tab', () => {
    expect(matchShortcut(mockEvent('w', { ctrl: true }))).toBe('close-tab');
  });

  it('matches DEFAULT_KEYMAP keys', () => {
    expect(Object.keys(DEFAULT_KEYMAP).length).toBeGreaterThan(0);
  });

  it('matches Ctrl+Shift+O for book-switcher', () => {
    expect(matchShortcut(mockEvent('o', { ctrl: true, shift: true }))).toBe('book-switcher');
  });

  it('matches Ctrl+P for quick-open', () => {
    expect(matchShortcut(mockEvent('p', { ctrl: true }))).toBe('quick-open');
  });

  it('matches Ctrl+Shift+F for book-search', () => {
    expect(matchShortcut(mockEvent('f', { ctrl: true, shift: true }))).toBe('book-search');
  });
});
