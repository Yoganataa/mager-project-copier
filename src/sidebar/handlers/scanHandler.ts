// src/sidebar/handlers/scanHandler.ts
import * as vscode from 'vscode';
import { scanWorkspace } from '../../core/fileScanner';
import { getGitChangedFiles } from '../../utils/git';
import { applyGitFilter } from '../../core/treeUtils';
import { restoreSelection, saveSelection } from '../../core/selectionStore';
import { UIState } from '../../core/uiState';
import { ProjectNode } from '../../types';

/**
 * Handles the workspace scanning action triggered from the sidebar.
 *
 * This function performs the following operations:
 * 1. Scans the workspace based on current UI settings (ignoring sensitive/git-ignored files).
 * 2. Notifies the user if any files were skipped due to size limitations (>1MB).
 * 3. Applies a filter if the scan mode is set to 'git' (showing only changed files).
 * 4. Restores previous selection state if performing a standard scan.
 * 5. Persists the current selection state.
 *
 * @param context - The extension context for state persistence.
 * @param uiState - The current UI configuration (ignore rules, etc.).
 * @param mode - The scan mode: 'all' for a full scan, or 'git' for changed files only.
 * @returns A promise that resolves to the root {@link ProjectNode} of the scanned tree, or null if no workspace is found.
 */
export async function handleScanAction(
  context: vscode.ExtensionContext,
  uiState: UIState,
  mode: 'all' | 'git'
): Promise<ProjectNode | null> {
  
  const { root, skippedFiles } = await scanWorkspace({
    useGitIgnore: uiState.useGitIgnore,
    excludeSensitive: uiState.excludeSensitive
  });

  if (!root) {
    vscode.window.showWarningMessage('Mager Project: No workspace detected.');
    return null;
  }

  if (skippedFiles.length > 0) {
    const preview = skippedFiles.slice(0, 3).join(', ');
    const suffix = skippedFiles.length > 3 ? `...and ${skippedFiles.length - 3} more` : '';
    
    vscode.window.showWarningMessage(
      `Mager Project: ${skippedFiles.length} large files (>1MB) were ignored: ${preview}${suffix}`
    );
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