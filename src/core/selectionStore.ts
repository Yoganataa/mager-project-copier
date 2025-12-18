// src/core/selectionStore.ts
import * as vscode from 'vscode';
import { ProjectNode } from '../types';

/**
 * Saves checkbox selection state to workspaceState.
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
 * Restores checkbox selection state from workspaceState.
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

function collect(
  node: ProjectNode,
  acc: Record<string, boolean>
): void {
  acc[node.path] = node.checked;
  node.children?.forEach(child => collect(child, acc));
}

function apply(
  node: ProjectNode,
  map: Record<string, boolean>
): void {
  if (map[node.path] !== undefined) {
    node.checked = map[node.path];
  }
  node.children?.forEach(child => apply(child, map));
}
