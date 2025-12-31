// src/sidebar/handlers/scanHandler.ts
import * as vscode from 'vscode';
import { scanWorkspace } from '../../core/fileScanner';
import { getGitChangedFiles } from '../../utils/git';
import { applyGitFilter } from '../../core/treeUtils';
import { restoreSelection, saveSelection } from '../../core/selectionStore';
import { UIState } from '../../core/uiState';
import { ProjectNode } from '../../types';

/**
 * Orchestrates the workspace scanning process initiated from the sidebar interface.
 * * This function handles the retrieval of the file structure, applies Git-based filtering if requested,
 * and manages the persistence of user file selections.
 * * @param context - The extension context used to access persistent storage for selection restoration.
 * @param uiState - The current UI configuration defining scan rules (e.g., .gitignore usage).
 * @param mode - The scanning mode: 'all' for a standard scan, or 'git' to filter for modified files.
 * @returns A promise resolving to the root {@link ProjectNode} of the scanned tree, or `null` if no workspace is found.
 */
export async function handleScanAction(
  context: vscode.ExtensionContext,
  uiState: UIState,
  mode: 'all' | 'git'
): Promise<ProjectNode | null> {
  
  const { root } = await scanWorkspace({
    useGitIgnore: uiState.useGitIgnore,
    excludeSensitive: uiState.excludeSensitive
  });

  if (!root) {
    vscode.window.showWarningMessage('Mager Project: No workspace detected.');
    return null;
  }

  if (mode === 'git') {
    const changes = await getGitChangedFiles(root.path);
    if (changes.size === 0) {
      vscode.window.showInformationMessage('Mager Project: No git changes detected.');
    }
    applyGitFilter(root, changes);
    vscode.window.showInformationMessage(`Mager Project: Focused on ${changes.size} changed files.`);
  } else {
    restoreSelection(context, root);
  }

  saveSelection(context, root);
  return root;
}