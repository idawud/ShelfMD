<script lang="ts">
  import type { Heading } from '$lib/types.js';

  let { headings, activeHeadingSlug, onJump } = $props<{
    headings: Heading[];
    activeHeadingSlug: string | null;
    onJump: (slug: string) => void;
  }>();
</script>

<aside
  class="w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800"
  aria-label="Document outline"
>
  <div class="p-3">
    <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
      Outline
    </h2>
    <nav>
      {#each headings as h (h.slug + h.line)}
        <button
          class="block w-full text-left py-0.5 text-sm truncate rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors px-1
            {h.slug === activeHeadingSlug ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}"
          style="padding-left: {(h.level - 1) * 12 + 4}px"
          onclick={() => onJump(h.slug)}
          title={h.text}
        >
          {h.text}
        </button>
      {/each}
      {#if headings.length === 0}
        <p class="text-xs text-gray-400 italic">No headings</p>
      {/if}
    </nav>
  </div>
</aside>
