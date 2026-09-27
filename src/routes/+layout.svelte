<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="flex h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {@render children()}
</div>
