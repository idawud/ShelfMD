<script lang="ts">
  import { onMount } from 'svelte';
  import { renderMarkdown, extractHeadings } from '$lib/markdown.js';

  let content = $state('# Welcome to ShelfMD\n\nOpen a Markdown file to get started.\n\nUse **Ctrl+O** to open a file or drag a folder onto the window.');
  let rendered = $state('');
  let headings = $state<Array<{level: number; text: string; slug: string; line: number}>>([]);
  let readerEl = $state<HTMLElement | null>(null);

  $effect(() => {
    renderMarkdown(content).then(html => {
      rendered = html;
      headings = extractHeadings(content);
    });
  });
</script>

<div class="flex flex-1 overflow-hidden">
  <!-- Sidebar placeholder -->
  <aside class="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 hidden lg:block">
    <nav aria-label="Document outline">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Outline</h2>
      {#each headings as h}
        <a
          href="#{h.slug}"
          class="block py-0.5 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          style="padding-left: {(h.level - 1) * 12}px"
        >
          {h.text}
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Main reader -->
  <main
    class="flex-1 overflow-y-auto p-8"
    bind:this={readerEl}
    role="main"
    aria-label="Document content"
  >
    <article class="prose-reader prose dark:prose-invert max-w-none">
      {@html rendered}
    </article>
  </main>
</div>
