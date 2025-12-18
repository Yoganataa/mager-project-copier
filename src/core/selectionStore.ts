// src/core/selectionStore.ts
import * as vscode from 'vscode';
import { ProjectNode } from '../types';

/**
 * Persists the current checkbox selection state of the project tree to the VS Code workspace state.
 * * This allows the user's selection to remain consistent across VS Code sessions.
 *
 * @param context - The extension context used to access the global state storage.
 * @param root - The root node of the project tree containing the current selection state.
 */
export function saveSelection(
  context: vscode.ExtensionContext,
  root: ProjectNode
): void {
  const map: Record<string, boolean> = {};
  collect(root, map);
  context.workspaceState.update('magerProject.selection', map);
}

/**
 * Retrieves the previously saved selection state from the workspace state and applies it to the project tree.
 * * If a saved state exists for a specific node path, its `checked` property is updated accordingly.
 *
 * @param context - The extension context used to access the global state storage.
 * @param root - The root node of the project tree where the selection state will be restored.
 */
export function restoreSelection(
  context: vscode.ExtensionContext,
  root: ProjectNode
): void {
  const map =
    context.workspaceState.get<Record<string, boolean>>(
      'magerProject.selection'
    ) ?? {};

  apply(root, map);
}

/**
 * Recursively traverses the project tree to collect the checked state of all nodes.
 * * @param node - The current node being processed.
 * @param acc - The accumulator object where path-to-checked mappings are stored.
 */
function collect(
  node: ProjectNode,
  acc: Record<string, boolean>
): void {
  acc[node.path] = node.checked;
  node.children?.forEach(child => collect(child, acc));
}

/**
 * Recursively traverses the project tree and applies the checked state from the provided map.
 * * @param node - The current node being processed.
 * @param map - The dictionary containing saved selection states keyed by file path.
 */
function apply(
  node: ProjectNode,
  map: Record<string, boolean>
): void {
  if (map[node.path] !== undefined) {
    node.checked = map[node.path];
  }
  node.children?.forEach(child => apply(child, map));
}