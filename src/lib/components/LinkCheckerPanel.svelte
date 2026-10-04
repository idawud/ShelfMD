<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import type { ScanEntry } from '$lib/types.js';

  interface Props {
    filePath: string | null;
    bookRoot: string | null;
    onClose: () => void;
    onJump: (line: number) => void;
  }
  let { filePath, bookRoot, onClose, onJump }: Props = $props();

  let entries = $state<ScanEntry[]>([]);
  let scanning = $state(false);
  let scanned = $state(false);
  let scanError = $state<string | null>(null);

  $effect(() => {
    if (filePath) {
      scan();
    }
  });

  async function scan() {
    if (!filePath) return;
    scanning = true;
    scanned = false;
    scanError = null;
    try {
      entries = await invoke<ScanEntry[]>('scan_links', {
        filePath,
        bookRoot,
      });
      scanned = true;
    } catch (err) {
      scanError = `Failed to check links: ${String(err)}`;
    } finally {
      scanning = false;
    }
  }

  let broken = $derived(entries.filter(e => e.broken));
  let ok = $derived(entries.filter(e => !e.broken));
</script>

<div
  class="fixed inset-0 bg-black/40 flex items-start justify-center pt-20 z-50"
  role="dialog"
  aria-modal="true"
  aria-label="Link checker"
  tabindex="-1"
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[560px] max-h-[70vh] flex flex-col overflow-hidden"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <h2 class="font-semibold text-sm">Link Checker</h2>
      {#if scanned}
        <span class="text-xs text-gray-500">{entries.length} links · {broken.length} broken</span>
      {/if}
      <button class="text-gray-400 hover:text-gray-600 text-lg leading-none" onclick={onClose} aria-label="Close">✕</button>
    </div>

    <div class="flex-1 overflow-y-auto">
      {#if scanning}
        <p class="text-gray-400 text-sm px-4 py-4 animate-pulse">Scanning links…</p>
      {:else if scanError}
        <div class="flex items-center justify-between gap-4 px-4 py-4" role="alert">
          <p class="text-red-600 dark:text-red-400 text-sm">{scanError}</p>
          <button
            class="shrink-0 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            onclick={scan}
          >Retry</button>
        </div>
      {:else if scanned && broken.length === 0}
        <p class="text-green-600 text-sm px-4 py-4">✓ All {ok.length} links are valid.</p>
      {:else if scanned}
        {#each broken as entry (entry.href + entry.line)}
          <button
            class="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
            onclick={() => onJump(entry.line)}
          >
            <span class="text-red-500 font-bold shrink-0 text-xs mt-0.5">L{entry.line}</span>
            <span class="text-sm text-red-700 dark:text-red-400 truncate">{entry.href}</span>
          </button>
        {/each}
        {#if ok.length > 0}
          <details class="px-4 py-2">
            <summary class="text-xs text-gray-400 cursor-pointer">Show {ok.length} valid links</summary>
            {#each ok as entry (entry.href + entry.line)}
              <div class="flex items-start gap-3 py-1">
                <span class="text-green-500 text-xs shrink-0">L{entry.line}</span>
                <span class="text-xs text-gray-500 truncate">{entry.href}</span>
              </div>
            {/each}
          </details>
        {/if}
      {/if}
    </div>
  </div>
</div>
