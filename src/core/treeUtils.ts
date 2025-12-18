// src/core/treeUtils.ts
import { ProjectNode } from '../types';
import { normalizePath } from './pathUtils';

/**
 * Updates the checkbox state of a specific node and ensures tree consistency.
 *
 * This function performs two operations:
 * 1. Propagates the new state downwards to all descendants of the target node.
 * 2. Re-evaluates the state of parent nodes upwards to reflect the changes.
 *
 * @param root - The root node of the project tree.
 * @param targetPath - The absolute path of the node being toggled.
 * @param checked - The new checkbox state to apply.
 */
export function updateNodeCheckState(
  root: ProjectNode,
  targetPath: string,
  checked: boolean
): void {
  updateDown(root, targetPath, checked);
  updateUp(root);
}

/**
 * Filters the project tree selection to include only files modified in Git.
 *
 * This function traverses the tree recursively:
 * - Files are checked only if their normalized path exists in the `gitChanges` set.
 * - Directories are marked as checked if they contain at least one checked descendant.
 *
 * @param node - The current node being evaluated.
 * @param gitChanges - A set containing the absolute paths of modified files.
 * @returns `true` if the node (or any of its children) is checked; otherwise, `false`.
 */
export function applyGitFilter(
  node: ProjectNode,
  gitChanges: Set<string>
): boolean {
  const currentPath = normalizePath(node.path);

  if (node.type === 'file') {
    node.checked = gitChanges.has(currentPath);
    return node.checked;
  }

  let anyChildChecked = false;
  if (node.children) {
    for (const child of node.children) {
      const childChecked = applyGitFilter(child, gitChanges);
      anyChildChecked = anyChildChecked || childChecked;
    }
  }

  node.checked = anyChildChecked;
  return node.checked;
}

// ======================================================
// Internal Helpers
// ======================================================

function updateDown(
  node: ProjectNode,
  targetPath: string,
  checked: boolean
): boolean {
  if (node.path === targetPath) {
    setRecursive(node, checked);
    return true;
  }

  return (
    node.children?.some(child =>
      updateDown(child, targetPath, checked)
    ) ?? false
  );
}

function updateUp(node: ProjectNode): boolean {
  if (!node.children || node.children.length === 0) {
    return node.checked;
  }

  const allChecked = node.children.every(child =>
    updateUp(child)
  );

  node.checked = allChecked;
  return node.checked;
}

function setRecursive(
  node: ProjectNode,
  checked: boolean
): void {
  node.checked = checked;
  node.children?.forEach(child =>
    setRecursive(child, checked)
  );
}