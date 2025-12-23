// src/sidebar/handlers/copyHandler.ts
import * as vscode from 'vscode';
import { buildSnapshot, buildAsciiTree, buildPathTree } from '../../core/snapshotBuilder';
import { applyTemplate } from '../../core/templateManager';
import { estimateTokens } from '../../core/tokenEstimator';
import { splitSnapshot } from '../../core/snapshotSplitter';
import { DEFAULT_TOKEN_LIMIT } from '../../data/constants';
import { ProjectNode } from '../../types';
import { UIState } from '../../core/uiState';

/**
 * Handles the "Copy to Clipboard" action (Full Snapshot).
 *
 * This function orchestrates the entire copy workflow:
 * 1. Validates that project data exists.
 * 2. Uses the selected output format (XML or Markdown).
 * 3. Generates the snapshot and applies the selected prompt template.
 * 4. Estimates the token count (for user info).
 * 5. Handles overflow scenarios by offering to split the content.
 * 6. Writes the final result to the system clipboard.
 *
 * @param treeData - The root node of the scanned project tree.
 * @param uiState - The current state of the UI (selected format, template, etc.).
 * @returns A promise that resolves when the operation is complete.
 */
export async function handleCopyAction(
  treeData: ProjectNode | null,
  uiState: UIState
): Promise<void> {
  if (!treeData) {
    vscode.window.showWarningMessage('Mager Project: Please scan the project first.');
    return;
  }

  // Use the explicitly selected format
  const format = uiState.selectedFormat;

  const rawSnapshot = await buildSnapshot(treeData, format);

  const finalContent = applyTemplate(
    rawSnapshot,
    uiState.selectedTemplate
  );

  // Use a default safe limit for warning, since specific models are removed.
  const tokenLimit = DEFAULT_TOKEN_LIMIT; 

  const estimate = estimateTokens(finalContent, tokenLimit);

  if (!estimate.withinLimit) {
    const choice = await vscode.window.showWarningMessage(
      `Result is large (~${estimate.tokens.toLocaleString()} tokens). Recommended limit: ${tokenLimit.toLocaleString()}.`,
      'Copy Anyway',
      'Split Snapshot',
      'Cancel'
    );

    if (choice === 'Cancel' || !choice) {
        return;
    }

    if (choice === 'Split Snapshot') {
      const chunks = splitSnapshot(finalContent, tokenLimit);
      const combined = chunks
        .map(c => `# Part ${c.index}\n\n${c.content}`)
        .join('\n\n---\n\n');
      
      await vscode.env.clipboard.writeText(combined);
      vscode.window.showInformationMessage(`Copied split content (${chunks.length} parts).`);
      return;
    }
    // If 'Copy Anyway' is selected, proceed below.
  }

  await vscode.env.clipboard.writeText(finalContent);
  
  const formatName = format.toUpperCase();
  vscode.window.showInformationMessage(
    `Copied as ${formatName} (~${estimate.tokens.toLocaleString()} tokens).`
  );
}

/**
 * Handles the "Copy Tree Only" action.
 * Prompts the user to choose between ASCII or Path List format.
 */
export async function handleCopyTreeAction(treeData: ProjectNode | null): Promise<void> {
    if (!treeData) {
        vscode.window.showWarningMessage('Mager Project: Please scan the project first.');
        return;
    }

    const choice = await vscode.window.showQuickPick(
        [
            { label: 'ASCII Tree', description: 'Visual indentation (Good for context)', id: 'ascii' },
            { label: 'Path List', description: 'Simple file paths (Compact)', id: 'path' }
        ],
        { placeHolder: 'Select Tree Format' }
    );

    if (!choice) { return; }

    let content = '';
    if (choice.id === 'ascii') {
        content = buildAsciiTree(treeData);
    } else {
        content = buildPathTree(treeData);
    }

    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage(`Copied Project Tree (${choice.label}).`);
}