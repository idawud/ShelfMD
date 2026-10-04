<script lang="ts">
  import type { Tab } from '$lib/types.js';

  let { tabs, activeId, onActivate, onClose, onNew } = $props<{
    tabs: Tab[];
    activeId: string;
    onActivate: (id: string) => void;
    onClose: (id: string) => void;
    onNew: () => void;
  }>();
</script>

<div class="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-x-auto shrink-0" role="tablist" aria-label="Open tabs">
  {#each tabs as tab (tab.id)}
    <button
      role="tab"
      aria-selected={tab.id === activeId}
      class="flex items-center gap-1 px-3 py-2 text-sm whitespace-nowrap border-r border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0
        {tab.id === activeId ? 'bg-white dark:bg-gray-900 border-b-2 border-b-blue-500' : 'text-gray-600 dark:text-gray-400'}"
      onclick={() => onActivate(tab.id)}
    >
      {#if tab.isDirty}
        <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Unsaved changes"></span>
      {/if}
      <span class="max-w-32 truncate">{tab.title}</span>
      {#if !tab.pinned}
        <span
          class="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs leading-none"
          role="button"
          tabindex="0"
          aria-label="Close tab"
          onclick={(e) => { e.stopPropagation(); onClose(tab.id); }}
          onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClose(tab.id); } }}
        >×</span>
      {/if}
    </button>
  {/each}

  <button
    class="px-3 py-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none shrink-0"
    onclick={onNew}
    title="New tab (Ctrl+T)"
    aria-label="New tab"
  >+</button>
</div>
