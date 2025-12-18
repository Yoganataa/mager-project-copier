// src/core/treeUtils.ts
import { ProjectNode } from '../types';

/**
 * Updates checkbox state for a node and syncs its children and parents.
 *
 * @param root - Root project node
 * @param targetPath - Absolute path of toggled node
 * @param checked - New checked state
 */
export function updateNodeCheckState(
  root: ProjectNode,
  targetPath: string,
  checked: boolean
): void {
  updateDown(root, targetPath, checked);
  updateUp(root);
}

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
