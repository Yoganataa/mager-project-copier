// src/core/uiState.ts
import * as vscode from 'vscode';

/**
 * Represents the persistent state of the User Interface configuration.
 * * This state is preserved across VS Code sessions to maintain user preferences.
 */
export type UIState = {
  /** Indicates whether the .gitignore filter is currently active. */
  useGitIgnore: boolean;
  /** Indicates whether sensitive files are currently excluded from the view. */
  excludeSensitive: boolean;
  /** The identifier of the currently selected AI model. */
  selectedModel: string;
  /** The identifier of the currently selected prompt template. */
  selectedTemplate: string;
};

const STORAGE_KEY = 'magerProject.uiState';

/**
 * Loads the UI state from the workspace storage.
 * * If no saved state is found, it initializes with default values favoring modern standards.
 *
 * @param context - The extension context used to access the global state storage.
 * @returns The current {@link UIState} object.
 */
export function loadUIState(
  context: vscode.ExtensionContext
): UIState {
  return (
    context.workspaceState.get<UIState>(STORAGE_KEY) ?? {
      useGitIgnore: true,
      excludeSensitive: true,
      selectedModel: 'gpt-5.2',
      selectedTemplate: 'default'
    }
  );
}

/**
 * Persists the current UI configuration to the workspace storage.
 * * @param context - The extension context used to access the global state storage.
 * @param state - The {@link UIState} object to be saved.
 */
export function saveUIState(
  context: vscode.ExtensionContext,
  state: UIState
): void {
  context.workspaceState.update(STORAGE_KEY, state);
}