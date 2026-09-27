<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte.js';

  let { onSelect, onClose } = $props<{
    onSelect: (bookId: number) => void;
    onClose: () => void;
  }>();

  let query = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);

  import { onMount } from 'svelte';
  onMount(() => inputEl?.focus());

  let filtered = $derived(
    libraryStore.books
      .filter(b => b.book.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        // Most recently opened first
        const ta = a.book.last_opened_at ?? '';
        const tb = b.book.last_opened_at ?? '';
        return tb.localeCompare(ta);
      })
      .slice(0, 10)
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
    aria-label="Switch book"
    tabindex="-1"
  >
    <input
      bind:this={inputEl}
      bind:value={query}
      type="search"
      placeholder="Switch book…"
      class="w-full px-4 py-3 text-lg border-b border-gray-200 dark:border-gray-700 bg-transparent outline-none"
    />
    <ul role="listbox" class="max-h-64 overflow-y-auto">
      {#each filtered as item (item.book.id)}
        <li role="option" aria-selected={item.book.id === libraryStore.activeBookId}>
          <button
            class="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3
              {!item.exists ? 'opacity-50' : ''}"
            onclick={() => { onSelect(item.book.id); onClose(); }}
          >
            <span class="flex-1 truncate">{item.book.name}</span>
            {#if !item.exists}
              <span class="text-xs text-red-500">unavailable</span>
            {/if}
            {#if item.book.last_opened_at}
              <span class="text-xs text-gray-400 shrink-0">
                {new Date(item.book.last_opened_at).toLocaleDateString()}
              </span>
            {/if}
          </button>
        </li>
      {/each}
      {#if filtered.length === 0}
        <li class="px-4 py-3 text-gray-400 text-sm">No books found</li>
      {/if}
    </ul>
  </div>
</div>
