<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  let { bookId, onNavigate, onClose } = $props<{
    bookId: number;
    onNavigate: (path: string, line: number) => void;
    onClose: () => void;
  }>();

  let query = $state('');
  let results = $state<Array<{ file_path: string; title: string; snippet: string; line: number; score: number }>>([]);
  let searching = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);

  import { onMount } from 'svelte';
  onMount(() => inputEl?.focus());

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!query.trim()) { results = []; return; }
    debounceTimer = setTimeout(async () => {
      searching = true;
      try {
        results = await invoke('search_book', { bookId, query });
      } catch {
        results = [];
      } finally {
        searching = false;
      }
    }, 200);
  }
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50"
  onclick={onClose}
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
  role="presentation"
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-label="Book search"
    tabindex="-1"
  >
    <div class="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
      <input
        bind:this={inputEl}
        bind:value={query}
        oninput={handleInput}
        type="search"
        placeholder="Search entire book…"
        class="flex-1 py-3 bg-transparent outline-none"
      />
      {#if searching}
        <span class="text-xs text-gray-400 animate-pulse">Searching…</span>
      {/if}
    </div>
    <ul class="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
      {#each results as r (r.file_path + r.line)}
        <li>
          <button
            class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
            onclick={() => { onNavigate(r.file_path, r.line); onClose(); }}
          >
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</div>
            <div class="text-xs text-gray-500 truncate">{r.file_path}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{r.snippet}</div>
          </button>
        </li>
      {/each}
      {#if results.length === 0 && query && !searching}
        <li class="px-4 py-6 text-center text-gray-400 text-sm">No results for "{query}"</li>
      {/if}
    </ul>
  </div>
</div>
