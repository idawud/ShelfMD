<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(async () => {
    // Load DOMPurify into window for markdown sanitization
    const DOMPurify = await import('dompurify');
    (window as unknown as Record<string, unknown>)['DOMPurify'] = DOMPurify.default;
  });
</script>

<div class="flex h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {@render children()}
</div>
