<script lang="ts">
  import { bookmarksStore } from '$lib/stores/bookmarks.svelte.js';
  import type { BookmarkWithPath } from '$lib/types.js';

  interface Props {
    bookId: number | null;
    onNavigate: (path: string, line: number) => void;
  }
  let { bookId, onNavigate }: Props = $props();

  $effect(() => {
    if (bookId !== null) bookmarksStore.loadBook(bookId);
  });

  function label(bwp: BookmarkWithPath): string {
    const b = bwp.bookmark;
    return b.label ?? b.heading_text ?? `Line ${b.line}`;
  }

  function filename(relPath: string): string {
    return relPath.split(/[/\\]/).pop() ?? relPath;
  }
</script>

<div class="flex flex-col h-full overflow-y-auto text-sm">
  {#if bookmarksStore.bookBookmarks.length === 0}
    <p class="text-gray-400 px-3 py-4 text-xs">No bookmarks yet.<br/>Press Ctrl+Shift+D to add one.</p>
  {:else}
    {#each bookmarksStore.bookBookmarks as bwp (bwp.bookmark.id)}
      <div class="group flex items-start gap-1 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
        <button
          class="flex-1 text-left min-w-0"
          onclick={() => onNavigate(bwp.rel_path, bwp.bookmark.line)}
          title={bwp.rel_path}
        >
          <div class="truncate font-medium text-gray-800 dark:text-gray-200">{label(bwp)}</div>
          <div class="truncate text-gray-400 text-xs">{filename(bwp.rel_path)}:{bwp.bookmark.line}</div>
        </button>
        <button
          class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 shrink-0 p-0.5"
          onclick={() => bookmarksStore.remove(bwp.bookmark.id)}
          aria-label="Remove bookmark"
        >✕</button>
      </div>
    {/each}
  {/if}
</div>
