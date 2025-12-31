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
 * Executes the primary "Copy to Clipboard" workflow for the project snapshot.
 * * This function performs the following steps:
 * 1. Validates the existence of the scanned project tree.
 * 2. Generates a snapshot in the requested format (Markdown/XML).
 * 3. Applies the selected AI prompt template.
 * 4. Retrieves the token limit configuration from VS Code settings.
 * 5. Estimates the token count and checks against the limit.
 * 6. Handles overflow scenarios by allowing the user to split the output or copy anyway.
 * 7. Writes the final content to the system clipboard.
 * * @param treeData - The root node of the scanned project structure.
 * @param uiState - The current user interface state containing format and template preferences.
 * @returns A promise that resolves when the copy operation (and potential user interaction) is complete.
 */
export async function handleCopyAction(
    treeData: ProjectNode | null,
    uiState: UIState
): Promise<void> {
    if (!treeData) {
        vscode.window.showWarningMessage('Mager Project: Please scan the project first.');
        return;
    }

    const format = uiState.selectedFormat || 'markdown';

    const rawSnapshot = await buildSnapshot(treeData, format);

    const finalContent = applyTemplate(
        rawSnapshot,
        uiState.selectedTemplate
    );

    const config = vscode.workspace.getConfiguration('magerProject');
    const tokenLimit = config.get<number>('tokenLimit') || DEFAULT_TOKEN_LIMIT;

    const estimate = estimateTokens(finalContent, tokenLimit);

    if (!estimate.withinLimit) {
        const choice = await vscode.window.showWarningMessage(
            `Result is large (~${estimate.tokens.toLocaleString()} tokens). Configured limit: ${tokenLimit.toLocaleString()}.`,
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
    }

    await vscode.env.clipboard.writeText(finalContent);
    
    const formatName = (format || 'markdown').toUpperCase();
    vscode.window.showInformationMessage(
        `Copied as ${formatName} (~${estimate.tokens.toLocaleString()} tokens).`
    );
}

/**
 * Handles the "Copy Tree Only" command.
 * * This function prompts the user to select a visualization format (ASCII Tree or Flat Path List)
 * and copies the structure of the selected files to the clipboard without their content.
 * * @param treeData - The root node of the scanned project structure.
 * @returns A promise that resolves when the operation is complete.
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