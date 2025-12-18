// src/core/uiState.ts
import * as vscode from 'vscode';

export type UIState = {
  useGitIgnore: boolean;
  excludeSensitive: boolean;
};

const STORAGE_KEY = 'magerProject.uiState';

/**
 * Load UI toggle state from workspaceState.
 */
export function loadUIState(
  context: vscode.ExtensionContext
): UIState {
  return (
    context.workspaceState.get<UIState>(STORAGE_KEY) ?? {
      useGitIgnore: true,
      excludeSensitive: true
    }
  );
}

/**
 * Save UI toggle state to workspaceState.
 */
export function saveUIState(
  context: vscode.ExtensionContext,
  state: UIState
): void {
  context.workspaceState.update(STORAGE_KEY, state);
}
