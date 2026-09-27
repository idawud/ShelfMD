<script lang="ts">
  import { onMount } from 'svelte';

  let { query, container, onClose, onQueryChange } = $props<{
    query: string;
    container: HTMLElement | null;
    onClose: () => void;
    onQueryChange: (q: string) => void;
  }>();

  let inputEl = $state<HTMLInputElement | null>(null);
  let matchCount = $state(0);
  let currentMatch = $state(0);
  let marks: Element[] = [];

  onMount(() => {
    inputEl?.focus();
  });

  function clearMarks() {
    for (const m of marks) {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent ?? ''), m);
        parent.normalize();
      }
    }
    marks = [];
    matchCount = 0;
    currentMatch = 0;
  }

  function doFind(q: string) {
    clearMarks();
    if (!container || !q) return;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) textNodes.push(node);

    const lower = q.toLowerCase();
    for (const tn of textNodes) {
      const text = tn.textContent ?? '';
      const ltext = text.toLowerCase();
      let idx = ltext.indexOf(lower);
      if (idx === -1) continue;

      const frag = document.createDocumentFragment();
      let last = 0;
      while (idx !== -1) {
        if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
        const mark = document.createElement('mark');
        mark.className = 'find-highlight';
        mark.textContent = text.slice(idx, idx + q.length);
        frag.appendChild(mark);
        marks.push(mark);
        last = idx + q.length;
        idx = ltext.indexOf(lower, last);
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      tn.parentNode?.replaceChild(frag, tn);
    }

    matchCount = marks.length;
    if (matchCount > 0) {
      currentMatch = 1;
      (marks[0] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function next() {
    if (!marks.length) return;
    (marks[currentMatch - 1] as HTMLElement).classList.remove('find-highlight-active');
    currentMatch = (currentMatch % marks.length) + 1;
    const m = marks[currentMatch - 1] as HTMLElement;
    m.classList.add('find-highlight-active');
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function prev() {
    if (!marks.length) return;
    (marks[currentMatch - 1] as HTMLElement).classList.remove('find-highlight-active');
    currentMatch = currentMatch === 1 ? marks.length : currentMatch - 1;
    const m = marks[currentMatch - 1] as HTMLElement;
    m.classList.add('find-highlight-active');
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $effect(() => {
    doFind(query);
  });

  function handleClose() {
    clearMarks();
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'Enter') { if (e.shiftKey) prev(); else next(); }
  }
</script>

<div class="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm" role="search">
  <input
    bind:this={inputEl}
    type="search"
    placeholder="Find in document…"
    value={query}
    oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
    onkeydown={handleKeydown}
    class="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
    aria-label="Find text"
  />
  <span class="text-gray-500 text-xs tabular-nums">
    {matchCount > 0 ? `${currentMatch}/${matchCount}` : matchCount === 0 && query ? '0 matches' : ''}
  </span>
  <button onclick={prev} class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Previous (Shift+Enter)" aria-label="Previous match">↑</button>
  <button onclick={next} class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Next (Enter)" aria-label="Next match">↓</button>
  <button onclick={handleClose} class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Close (Esc)" aria-label="Close find bar">×</button>
</div>
