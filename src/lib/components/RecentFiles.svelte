<script lang="ts">
  import type { RecentFile } from '$lib/recent.js';

  let { files, onOpen }: { files: RecentFile[]; onOpen: (path: string) => void } = $props();
</script>

<section class="mx-auto max-w-2xl px-6 pt-8" aria-label="Recent files">
  <h2 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Saved &amp; recent files</h2>
  <ul class="divide-y divide-gray-200 dark:divide-gray-700 rounded border border-gray-200 dark:border-gray-700">
    {#each files as file (file.filePath)}
      <li>
        <button
          class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
          onclick={() => onOpen(file.filePath)}
          title={file.filePath}
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm text-gray-900 dark:text-gray-100">{file.title}</span>
            <span class="block truncate text-xs text-gray-500 dark:text-gray-400">{file.filePath}</span>
          </span>
          {#if file.saved}
            <span class="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200">saved</span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</section>
