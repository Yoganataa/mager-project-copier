// src/core/uiState.ts
import * as vscode from 'vscode';

/**
 * Represents the persistent configuration state of the user interface.
 * * This state is stored within the workspace context to maintain user preferences
 * (such as filter toggles and output formats) across VS Code sessions.
 */
export type UIState = {
    /** Indicates whether the `.gitignore` exclusion filter is currently active. */
    useGitIgnore: boolean;
    /** Indicates whether sensitive files (e.g., `.env`, credentials) are currently hidden. */
    excludeSensitive: boolean;
    /** The identifier of the currently selected output format for snapshot generation. */
    selectedFormat: 'markdown' | 'xml';
    /** The unique identifier of the currently selected prompt template. */
    selectedTemplate: string;
};

const STORAGE_KEY = 'magerProject.uiState';

/**
 * Retrieves the persisted UI state from the workspace storage.
 * * This function ensures backward compatibility by merging any existing saved state
 * with the default configuration values. If no state exists, defaults are returned.
 * * @param context - The extension context used to access the global workspace state.
 * @returns The current {@link UIState} object, guaranteed to have all required properties.
 */
export function loadUIState(
    context: vscode.ExtensionContext
): UIState {
    const saved = context.workspaceState.get<Partial<UIState>>(STORAGE_KEY);
    
    const defaults: UIState = {
        useGitIgnore: true,
        excludeSensitive: true,
        selectedFormat: 'markdown',
        selectedTemplate: 'default'
    };

    return { ...defaults, ...saved };
}

/**
 * Persists the provided UI configuration to the workspace storage.
 * * This allows the extension to remember the user's preferences (e.g., active filters)
 * the next time the workspace is opened.
 * * @param context - The extension context used to access the global workspace state.
 * @param state - The {@link UIState} object to be saved.
 */
export function saveUIState(
    context: vscode.ExtensionContext,
    state: UIState
): void {
    context.workspaceState.update(STORAGE_KEY, state);
}