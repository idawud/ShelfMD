<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';

  let { bookId, bookRoot, onSelect, onClose } = $props<{
    bookId: number;
    bookRoot: string;
    onSelect: (path: string) => void;
    onClose: () => void;
  }>();

  let query = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);
  let allFiles = $state<Array<[number, string, string | null]>>([]);

  onMount(async () => {
    inputEl?.focus();
    allFiles = await invoke<Array<[number, string, string | null]>>('list_book_files', { bookId });
  });

  let filtered = $derived(
    allFiles
      .filter(([, path, title]) => {
        const q = query.toLowerCase();
        return path.toLowerCase().includes(q) || (title ?? '').toLowerCase().includes(q);
      })
      .slice(0, 15)
  );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50"
  onclick={onClose}
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-label="Quick open"
    tabindex="-1"
  >
    <input
      bind:this={inputEl}
      bind:value={query}
      type="search"
      placeholder="Quick open…"
      class="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-transparent outline-none"
    />
    <ul class="max-h-64 overflow-y-auto">
      {#each filtered as [, path, title] (path)}
        <button
          class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
          onclick={() => { onSelect(bookRoot + '/' + path); onClose(); }}
        >
          <span class="text-sm truncate">{title ?? path.split('/').pop()}</span>
          <span class="text-xs text-gray-400 truncate">{path}</span>
        </button>
      {/each}
      {#if filtered.length === 0 && query}
        <li class="px-4 py-3 text-gray-400 text-sm">No files found</li>
      {/if}
    </ul>
  </div>
</div>
