<script lang="ts">
  import { treeStore, type TreeNode } from '$lib/stores/tree.svelte.js';

  let { onOpenFile, activePath = null } = $props<{
    onOpenFile: (path: string) => void;
    activePath?: string | null;
  }>();

  const normalize = (path: string) => path.replace(/\\/g, '/').toLowerCase();
  let activeKey = $derived(activePath ? normalize(activePath) : null);
</script>

<div class="flex-1 overflow-y-auto text-sm">
  {#snippet nodeList(nodes: TreeNode[], depth: number)}
    {#each nodes as node (node.path)}
      {#if node.isDir}
        <button
          class="flex items-center w-full text-left py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded truncate"
          style="padding-left: {depth * 12 + 4}px"
          onclick={() => treeStore.toggleExpanded(node.path)}
        >
          <span class="mr-1 text-gray-400">{node.expanded ? '▾' : '▸'}</span>
          <span class="text-gray-600 dark:text-gray-400 truncate">{node.name}</span>
        </button>
        {#if node.expanded && node.children}
          {@render nodeList(node.children, depth + 1)}
        {/if}
      {:else}
        {@const isActive = normalize(node.path) === activeKey}
        <button
          class="block w-full text-left py-0.5 rounded truncate {isActive
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-medium'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}"
          style="padding-left: {depth * 12 + 16}px"
          onclick={() => onOpenFile(node.path)}
          title={node.name}
          aria-current={isActive ? 'true' : undefined}
        >
          {node.name}
        </button>
      {/if}
    {/each}
  {/snippet}
  {@render nodeList(treeStore.nodes, 0)}
</div>
