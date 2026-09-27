<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { renderMarkdown, extractHeadings, slugify } from '$lib/markdown.js';
  import { settingsStore } from '$lib/stores/settings.svelte.js';
  import { tabStore } from '$lib/stores/tabs.svelte.js';
  import { getScrollPosition, scrollToLine, scrollToSlug } from '$lib/scroll.js';
  import { matchShortcut } from '$lib/shortcuts.js';
  import {
    createLinkHandler,
    createHoverHandler,
    markBrokenLinks,
    rewriteImagePaths,
  } from '$lib/links.js';
  import { progressStore } from '$lib/stores/progress.svelte.js';
  import type { Heading } from '$lib/types.js';
  import type { OpenFileResult, OpenWithMemoryResult } from '$lib/types.js';
  import TabBar from './TabBar.svelte';
  import Outline from './Outline.svelte';
  import FindBar from './FindBar.svelte';

  // ——— State ———
  let readerEl = $state<HTMLElement | null>(null);
  let rendered = $state('');
  let headings = $state<Heading[]>([]);
  let findOpen = $state(false);
  let findQuery = $state('');
  let isZenMode = $state(false);
  let sidebarOpen = $state(true);
  let showLightbox = $state(false);
  let lightboxSrc = $state('');
  let activeHeadingSlug = $state<string | null>(null);
  let toasts = $state<Array<{ id: string; message: string; type: string }>>([]);
  let isLoading = $state(false);
  let statusText = $state('');
  let currentFileId = $state<number | null>(null);

  // Derived from active tab
  let activeTab = $derived(tabStore.active);
  let content = $derived(activeTab?.content ?? '');
  let settings = $derived(settingsStore.value);

  // ——— Navigation function (LNK-01, LNK-06, LNK-10/11, LNK-18) ———
  async function navigateToFile(filePath: string, anchor?: string, newTab?: boolean) {
    try {
      // LNK-11: if target is already open, just focus that tab
      const existing = tabStore.findByPath(filePath);
      if (existing && !newTab) {
        tabStore.activate(existing.id);
        if (anchor) {
          await tick();
          if (readerEl) scrollToSlug(readerEl, anchor);
        }
        return;
      }
      if (existing && newTab) {
        tabStore.activate(existing.id);
        return;
      }

      // Save progress for current file before navigating
      if (currentFileId !== null && readerEl) {
        await progressStore.save(currentFileId, readerEl);
      }

      const result = await invoke<OpenWithMemoryResult>('open_file_with_memory', { path: filePath, bookId: null });

      // Save current scroll before navigating
      const currentScrollLine = readerEl ? getScrollPosition(readerEl).line : 0;

      let targetTabId: string;
      if (newTab) {
        const tab = tabStore.open({
          filePath: result.canonical_path,
          title: result.file_name,
          content: result.content,
        });
        targetTabId = tab.id;
      } else {
        if (!activeTab) return;
        targetTabId = activeTab.id;

        // Push current location to history before navigating
        if (activeTab.filePath) {
          tabStore.navigate(targetTabId, {
            filePath: activeTab.filePath,
            scrollLine: currentScrollLine,
          });
        }

        tabStore.update(targetTabId, {
          filePath: result.canonical_path,
          title: result.file_name,
          content: result.content,
          scrollLine: 0,
        });

        // Push new location to history
        tabStore.navigate(targetTabId, {
          filePath: result.canonical_path,
          anchor,
          scrollLine: 0,
        });
      }

      // Store file ID for progress tracking
      currentFileId = result.file_id;

      // MEM-05: Restore position if progress exists
      if (result.progress && !anchor) {
        const prog = result.progress;
        await tick();
        await tick();
        if (readerEl) {
          if (!result.content_changed && prog.heading_slug) {
            scrollToSlug(readerEl, prog.heading_slug);
          } else if (!result.content_changed) {
            scrollToLine(readerEl, prog.top_line);
          } else if (result.content_changed && prog.heading_text) {
            // MEM-02: content changed, try to find heading by text
            const headingEls = Array.from(readerEl.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'));
            const match = headingEls.find(h => h.textContent?.trim() === prog.heading_text);
            if (match) match.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }
        // MEM-05: "Resumed at" toast
        const loc = prog.heading_text ?? `line ${prog.top_line}`;
        showToast(`Resumed at: ${loc}`, 'info');
      }

      // LNK-06: scroll to anchor after render
      if (anchor) {
        await tick();
        await tick();
        if (readerEl) scrollToSlug(readerEl, anchor);
      }
    } catch (err) {
      showToast(`Failed to open: ${String(err)}`, 'error');
    }
  }

  // ——— Render on content change ———
  $effect(() => {
    if (!content) { rendered = ''; headings = []; return; }
    isLoading = true;
    renderMarkdown(content).then(async html => {
      rendered = html;
      headings = extractHeadings(content);
      isLoading = false;
      // Restore scroll after render
      await tick();
      if (readerEl && activeTab?.scrollLine) {
        scrollToLine(readerEl, activeTab.scrollLine);
      }
      // LNK-15, LNK-17: post-process links and images
      if (readerEl && activeTab?.filePath) {
        const file = activeTab.filePath;
        const root = null; // bookRoot not tracked at reader level yet
        await markBrokenLinks(readerEl, file, root);
        await rewriteImagePaths(readerEl, file, root);
      }
    });
  });

  // ——— Add heading IDs after render ———
  $effect(() => {
    if (!readerEl || !rendered) return;
    tick().then(() => {
      if (!readerEl) return;
      const slugCounts: Record<string, number> = {};
      readerEl.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6').forEach(h => {
        const text = h.textContent ?? '';
        let slug = slugify(text);
        if (slugCounts[slug] !== undefined) {
          slugCounts[slug]++;
          slug = `${slug}-${slugCounts[slug]}`;
        } else {
          slugCounts[slug] = 0;
        }
        h.id = slug;
      });
    });
  });

  // ——— Wire up link click and hover handlers ———
  $effect(() => {
    if (!readerEl) return;

    const clickHandler = createLinkHandler({
      currentFile: activeTab?.filePath ?? null,
      bookRoot: null,
      onNavigate: navigateToFile,
      onToast: showToast,
      onStatus: (t) => { statusText = t; },
    });

    const { over, out } = createHoverHandler({
      currentFile: activeTab?.filePath ?? null,
      bookRoot: null,
      onStatus: (t) => { statusText = t; },
    });

    readerEl.addEventListener('click', clickHandler);
    readerEl.addEventListener('mouseover', over);
    readerEl.addEventListener('mouseout', out);

    return () => {
      readerEl?.removeEventListener('click', clickHandler);
      readerEl?.removeEventListener('mouseover', over);
      readerEl?.removeEventListener('mouseout', out);
    };
  });

  // ——— MEM-03: Progress debounce — runs while a file is open ———
  $effect(() => {
    if (currentFileId === null || !readerEl) return;
    const fileId = currentFileId;
    const container = readerEl;
    const stop = progressStore.startDebounce(fileId, container);
    return stop;
  });

  // ——— MEM-03: Flush progress on window blur ———
  function handleWindowBlur() {
    if (currentFileId !== null && readerEl) {
      progressStore.save(currentFileId, readerEl);
    }
  }

  // ——— Scroll tracking for active heading ———
  let scrollDebounce: ReturnType<typeof setTimeout> | null = null;
  function handleScroll() {
    if (scrollDebounce) clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
      if (!readerEl) return;
      const pos = getScrollPosition(readerEl);
      activeHeadingSlug = pos.headingSlug;
      if (activeTab) {
        tabStore.update(activeTab.id, { scrollLine: pos.line });
      }
    }, 100);
  }

  // ——— History navigation helper ———
  async function goBack() {
    if (!activeTab) return;
    const entry = tabStore.back(activeTab.id);
    if (!entry) return;
    try {
      const result = await invoke<OpenFileResult>('open_file', { path: entry.filePath });
      tabStore.update(activeTab.id, {
        filePath: result.canonical_path,
        title: result.file_name,
        content: result.content,
        scrollLine: entry.scrollLine,
      });
      await tick();
      if (readerEl && entry.scrollLine) scrollToLine(readerEl, entry.scrollLine);
      if (readerEl && entry.anchor) scrollToSlug(readerEl, entry.anchor);
    } catch (err) {
      showToast(`Failed to navigate back: ${String(err)}`, 'error');
    }
  }

  async function goForward() {
    if (!activeTab) return;
    const entry = tabStore.forward(activeTab.id);
    if (!entry) return;
    try {
      const result = await invoke<OpenFileResult>('open_file', { path: entry.filePath });
      tabStore.update(activeTab.id, {
        filePath: result.canonical_path,
        title: result.file_name,
        content: result.content,
        scrollLine: entry.scrollLine,
      });
      await tick();
      if (readerEl && entry.scrollLine) scrollToLine(readerEl, entry.scrollLine);
      if (readerEl && entry.anchor) scrollToSlug(readerEl, entry.anchor);
    } catch (err) {
      showToast(`Failed to navigate forward: ${String(err)}`, 'error');
    }
  }

  // ——— Keyboard shortcuts ———
  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const action = matchShortcut(e);
    if (!action) return;

    const SCROLL_AMOUNT = 80;
    const HALF_PAGE = readerEl ? readerEl.clientHeight / 2 : 300;

    switch (action) {
      case 'scroll-down':
        readerEl?.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'scroll-up':
        readerEl?.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'scroll-top':
        readerEl?.scrollTo({ top: 0, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'scroll-bottom':
        readerEl?.scrollTo({ top: readerEl.scrollHeight, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'scroll-half-down':
        readerEl?.scrollBy({ top: HALF_PAGE, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'scroll-half-up':
        readerEl?.scrollBy({ top: -HALF_PAGE, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'heading-prev':
      case 'heading-next': {
        if (!readerEl) break;
        const hEls = Array.from(readerEl.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'));
        const ctr = readerEl.getBoundingClientRect();
        const curIdx = hEls.findIndex(h => h.getBoundingClientRect().top - ctr.top > 10);
        const tgt = action === 'heading-next'
          ? hEls[curIdx === -1 ? 0 : curIdx]
          : hEls[Math.max(0, (curIdx === -1 ? hEls.length : curIdx) - 2)];
        tgt?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        e.preventDefault();
        break;
      }
      case 'find':
        findOpen = true;
        e.preventDefault();
        break;
      case 'find-close':
        findOpen = false;
        e.preventDefault();
        break;
      case 'new-tab':
        tabStore.open();
        e.preventDefault();
        break;
      case 'close-tab':
        if (activeTab) tabStore.close(activeTab.id);
        e.preventDefault();
        break;
      case 'tab-1': case 'tab-2': case 'tab-3': case 'tab-4': case 'tab-5':
      case 'tab-6': case 'tab-7': case 'tab-8': case 'tab-9': {
        const n = parseInt(action.split('-')[1], 10) - 1;
        tabStore.activateByIndex(n);
        e.preventDefault();
        break;
      }
      case 'zoom-in':
        settingsStore.update({ zoom: Math.min(settings.zoom + 0.1, 3) });
        e.preventDefault();
        break;
      case 'zoom-out':
        settingsStore.update({ zoom: Math.max(settings.zoom - 0.1, 0.5) });
        e.preventDefault();
        break;
      case 'zoom-reset':
        settingsStore.update({ zoom: 1.0 });
        e.preventDefault();
        break;
      case 'zen-toggle':
        isZenMode = !isZenMode;
        e.preventDefault();
        break;
      case 'sidebar-toggle':
        sidebarOpen = !sidebarOpen;
        e.preventDefault();
        break;
      case 'nav-back':
        goBack();
        e.preventDefault();
        break;
      case 'nav-forward':
        goForward();
        e.preventDefault();
        break;
    }
  }

  // ——— Toast helper ———
  function showToast(message: string, type = 'info') {
    const id = crypto.randomUUID();
    toasts.push({ id, message, type });
    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id);
      if (idx !== -1) toasts.splice(idx, 1);
    }, 4000);
  }

  // ——— Lightbox ———
  function handleImageClick(e: MouseEvent) {
    const img = (e.target as HTMLElement).closest('img[data-lightbox]') as HTMLImageElement | null;
    if (!img) return;
    lightboxSrc = img.src;
    showLightbox = true;
  }

  // ——— Combined click handler (image lightbox + link navigation) ———
  function handleMainClick(e: MouseEvent) {
    handleImageClick(e);
    // Link handler is attached via $effect with addEventListener
  }

  // ——— Mouse button 4/5 for history (LNK-18/19/20) ———
  function handleAuxClick(e: MouseEvent) {
    if (e.button === 3) { goBack(); e.preventDefault(); }
    else if (e.button === 4) { goForward(); e.preventDefault(); }
  }

  function closeLightbox() { showLightbox = false; lightboxSrc = ''; }

  // ——— Init ———
  onMount(() => {
    tabStore.init();
    if (tabStore.tabs.length === 1 && !tabStore.active?.content) {
      tabStore.update(tabStore.tabs[0].id, {
        content: `# Welcome to ShelfMD

**A beautiful Markdown book reader for Windows 11.**

Open a Markdown file with **Ctrl+O** or drag a folder onto the window.

## Features

- Cross-file links with full resolution
- Reading memory — resumes exactly where you stopped
- Library of books with one-key switching
- Beautiful typography, Light/Dark/Sepia themes

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| \`j\` / \`k\` | Scroll down / up |
| \`gg\` / \`G\` | Top / bottom |
| \`Ctrl+F\` | Find in document |
| \`Ctrl+T\` | New tab |
| \`F11\` | Zen mode |
| \`Ctrl+=\` / \`Ctrl+-\` | Zoom in/out |
| \`Alt+Left\` / \`Alt+Right\` | Navigate back/forward |

## Math Example

Inline math: $E = mc^2$

Block math:

$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

## Code Example

\`\`\`rust
fn main() {
    println!("Hello, ShelfMD!");
}
\`\`\`

> [!NOTE]
> This is a GitHub-style admonition.

> [!WARNING]
> Links to other .md files are fully resolved by ShelfMD.
`,
        title: 'Welcome',
      });
    }
  });

  // CSS variables from settings
  let cssVars = $derived(
    `--reader-font: ${settings.fontFamily};` +
    `--reader-size: ${settings.fontSize}px;` +
    `--reader-lh: ${settings.lineHeight};` +
    `--reader-width: ${settings.contentWidth}ch;` +
    `--reader-zoom: ${settings.zoom};`
  );

  // Derived: can we go back/forward?
  let canBack = $derived(activeTab ? tabStore.canBack(activeTab.id) : false);
  let canForward = $derived(activeTab ? tabStore.canForward(activeTab.id) : false);
</script>

<svelte:window onkeydown={handleKeydown} onblur={handleWindowBlur} />

<div
  class="flex flex-col h-screen overflow-hidden {settings.theme === 'dark' ? 'dark' : settings.theme === 'sepia' ? 'sepia' : ''}"
  style={cssVars}
>
  <!-- Tab bar -->
  {#if !isZenMode}
    <TabBar
      tabs={tabStore.tabs}
      activeId={tabStore.active?.id ?? ''}
      onActivate={(id) => tabStore.activate(id)}
      onClose={(id) => tabStore.close(id)}
      onNew={() => tabStore.open()}
    />
  {/if}

  <!-- Nav toolbar (LNK-18/19) -->
  {#if !isZenMode}
    <div class="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
      <button
        class="p-1 rounded text-sm disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        disabled={!canBack}
        onclick={goBack}
        title="Back (Alt+Left)"
        aria-label="Navigate back"
      >&#8592;</button>
      <button
        class="p-1 rounded text-sm disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        disabled={!canForward}
        onclick={goForward}
        title="Forward (Alt+Right)"
        aria-label="Navigate forward"
      >&#8594;</button>
      {#if activeTab?.filePath}
        <span class="ml-2 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs" title={activeTab.filePath}>
          {activeTab.filePath.split('/').pop() ?? activeTab.filePath}
        </span>
      {/if}
    </div>
  {/if}

  <div class="flex flex-1 overflow-hidden relative">
    <!-- Sidebar -->
    {#if sidebarOpen && !isZenMode}
      <Outline
        {headings}
        {activeHeadingSlug}
        onJump={(slug) => {
          if (readerEl) scrollToSlug(readerEl, slug);
        }}
      />
    {/if}

    <!-- Reader area -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_redundant_roles -->
    <main
      class="flex-1 overflow-y-auto bg-white dark:bg-gray-900 sepia:bg-amber-50 transition-colors"
      style="zoom: {settings.zoom}"
      bind:this={readerEl}
      onscroll={handleScroll}
      onclick={handleMainClick}
      onauxclick={handleAuxClick}
      onkeydown={handleKeydown}
      aria-label="Document content"
    >
      {#if isLoading}
        <div class="flex items-center justify-center h-32 text-gray-400">
          <span class="animate-pulse">Rendering...</span>
        </div>
      {:else if rendered}
        <article
          class="prose-reader mx-auto py-8 px-6 prose prose-gray dark:prose-invert max-w-none"
        >
          {@html rendered}
        </article>
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
          <div class="text-6xl">&#128218;</div>
          <p class="text-lg">Open a Markdown file to get started</p>
          <p class="text-sm">Ctrl+O or drag a file here</p>
        </div>
      {/if}
    </main>
  </div>

  <!-- Find bar -->
  {#if findOpen}
    <FindBar
      query={findQuery}
      container={readerEl}
      onClose={() => { findOpen = false; }}
      onQueryChange={(q) => { findQuery = q; }}
    />
  {/if}

  <!-- LNK-16: Status bar -->
  {#if statusText}
    <div class="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 truncate shrink-0">
      {statusText}
    </div>
  {/if}

  <!-- Toasts -->
  <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
    {#each toasts as toast (toast.id)}
      <div
        class="px-4 py-2 rounded shadow-lg text-sm pointer-events-auto
          {toast.type === 'error' ? 'bg-red-600 text-white' :
           toast.type === 'warning' ? 'bg-yellow-500 text-white' :
           'bg-gray-800 text-white'}"
      >
        {toast.message}
      </div>
    {/each}
  </div>

  <!-- Lightbox -->
  {#if showLightbox}
    <div
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onclick={closeLightbox}
      onkeydown={(e) => { if (e.key === 'Escape') closeLightbox(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      tabindex="-1"
    >
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <img
        src={lightboxSrc}
        alt="Lightbox"
        class="max-w-[90vw] max-h-[90vh] object-contain"
        onclick={(e) => e.stopPropagation()}
      />
    </div>
  {/if}

  <!-- Zen mode exit hint -->
  {#if isZenMode}
    <div class="fixed top-2 right-2 text-xs text-gray-400/50 z-40">Press F11 to exit Zen mode</div>
  {/if}
</div>
