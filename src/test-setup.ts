// Provide Svelte 5 rune stubs for vitest (non-Svelte environment)
// $state is used in .svelte.ts store files; we stub it as identity for tests
// that only import pure functions from those modules.
(globalThis as Record<string, unknown>)['$state'] = <T>(v: T): T => v;
(globalThis as Record<string, unknown>)['$derived'] = <T>(v: T): T => v;
(globalThis as Record<string, unknown>)['$effect'] = (_fn: () => unknown): void => {};
