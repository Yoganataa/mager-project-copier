// src/sidebar/handlers/copyHandler.ts
import * as vscode from 'vscode';
import { buildSnapshot } from '../../core/snapshotBuilder';
import { applyTemplate } from '../../core/templateManager';
import { estimateTokens } from '../../core/tokenEstimator';
import { splitSnapshot } from '../../core/snapshotSplitter';
import { AI_MODELS, DEFAULT_TOKEN_LIMIT } from '../../data/constants';
import { ProjectNode } from '../../types';
import { UIState } from '../../core/uiState';

/**
 * Handles the "Copy to Clipboard" action triggered from the sidebar.
 *
 * This function orchestrates the entire copy workflow:
 * 1. Validates that project data exists.
 * 2. Determines the optimal output format (XML for Claude, Markdown for others).
 * 3. Generates the snapshot and applies the selected prompt template.
 * 4. Validates the content against the selected model's token limit.
 * 5. Handles overflow scenarios by offering to split the content.
 * 6. Writes the final result to the system clipboard.
 *
 * @param treeData - The root node of the scanned project tree.
 * @param uiState - The current state of the UI (selected model, template, etc.).
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

  const modelId = uiState.selectedModel;
  const isClaude = modelId.toLowerCase().includes('claude');
  const format = isClaude ? 'xml' : 'markdown';

  const rawSnapshot = await buildSnapshot(treeData, format);

  const finalContent = applyTemplate(
    rawSnapshot,
    uiState.selectedTemplate,
    modelId
  );

  const selectedModel = AI_MODELS.find(m => m.id === modelId);
  const tokenLimit = selectedModel ? selectedModel.limit : DEFAULT_TOKEN_LIMIT;

  const estimate = estimateTokens(finalContent, tokenLimit);

  if (!estimate.withinLimit) {
    const choice = await vscode.window.showWarningMessage(
      `Result too large (~${estimate.tokens.toLocaleString()} tokens). Limit: ${tokenLimit.toLocaleString()}.`,
      'Split Snapshot',
      'Cancel'
    );

    if (choice === 'Split Snapshot') {
      const chunks = splitSnapshot(finalContent, tokenLimit);
      const combined = chunks
        .map(c => `# Part ${c.index}\n\n${c.content}`)
        .join('\n\n---\n\n');
      
      await vscode.env.clipboard.writeText(combined);
      vscode.window.showInformationMessage(`Copied split content (${chunks.length} parts).`);
    }
    return;
  }

  await vscode.env.clipboard.writeText(finalContent);
  
  const formatName = format.toUpperCase();
  vscode.window.showInformationMessage(
    `Copied as ${formatName} (~${estimate.tokens.toLocaleString()} tokens).`
  );
}