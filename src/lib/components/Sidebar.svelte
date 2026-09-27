<script lang="ts">
  let { headings = [] } = $props<{
    headings: Array<{level: number; text: string; slug: string; line: number}>
  }>();
</script>

<aside class="w-64 min-w-0 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden" aria-label="Sidebar">
  <div class="flex-1 overflow-y-auto p-4">
    <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
      Outline
    </h2>
    <nav aria-label="Document outline">
      {#each headings as h}
        <a
          href="#{h.slug}"
          class="block py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate"
          style="padding-left: {(h.level - 1) * 0.75}rem"
        >
          {h.text}
        </a>
      {/each}
    </nav>
  </div>
</aside>
