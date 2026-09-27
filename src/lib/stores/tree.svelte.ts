import { invoke } from '@tauri-apps/api/core';

export interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
  expanded?: boolean;
  fileId?: number;
  title?: string;
}

function createTreeStore() {
  let nodes = $state<TreeNode[]>([]);
  let readingOrder = $state<string[]>([]);
  let expanded = $state<Set<string>>(new Set());

  function buildTree(files: Array<[number, string, string | null]>, root: string): TreeNode[] {
    // files: [file_id, rel_path, title]
    const dirs = new Map<string, TreeNode>();
    const rootNode: TreeNode = { name: '', path: root, isDir: true, children: [] };

    for (const [fileId, relPath, title] of files) {
      const parts = relPath.replace(/\\/g, '/').split('/');
      let current = rootNode;

      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/');
        if (!dirs.has(dirPath)) {
          const node: TreeNode = {
            name: parts[i],
            path: root + '/' + dirPath,
            isDir: true,
            children: [],
            expanded: expanded.has(root + '/' + dirPath),
          };
          dirs.set(dirPath, node);
          (current.children ??= []).push(node);
        }
        current = dirs.get(dirPath)!;
      }

      const fileName = parts[parts.length - 1];
      (current.children ??= []).push({
        name: fileName,
        path: relPath,
        isDir: false,
        fileId,
        title: title ?? undefined,
      });
    }

    return rootNode.children ?? [];
  }

  return {
    get nodes() { return nodes; },
    get readingOrder() { return readingOrder; },

    async loadBook(bookId: number, bookRoot: string) {
      const [files, order] = await Promise.all([
        invoke<Array<[number, string, string | null]>>('list_book_files', { bookId }),
        invoke<string[]>('get_reading_order', { bookRoot }),
      ]);
      readingOrder = order;
      nodes = buildTree(files, bookRoot);
    },

    toggleExpanded(path: string) {
      const node = findNode(nodes, path);
      if (node?.isDir) {
        node.expanded = !node.expanded;
        if (node.expanded) expanded.add(path);
        else expanded.delete(path);
      }
    },
  };
}

function findNode(nodes: TreeNode[], path: string): TreeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.children) {
      const found = findNode(n.children, path);
      if (found) return found;
    }
  }
  return null;
}

export const treeStore = createTreeStore();
