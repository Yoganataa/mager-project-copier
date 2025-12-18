// src/extension.ts
import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { scanWorkspace } from './core/fileScanner';
import { buildSnapshot } from './core/snapshotBuilder';
import { estimateTokens } from './core/tokenEstimator';
import { UpdateManager } from './core/updateManager';

/**
 * Activates the extension.
 * * This function is the entry point called by VS Code when the extension is activated.
 * It initializes the auto-update mechanism, registers the sidebar view provider,
 * and sets up the context menu commands.
 *
 * @param context - The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext): void {
  // =========================================================
  // 1. AUTO UPDATE SYSTEM
  // =========================================================
  const GITHUB_REPO = 'yoganataa/mager-project-copier'; 
  const updateManager = new UpdateManager(context, GITHUB_REPO);
  
  // Perform a silent check for updates on startup
  updateManager.checkForUpdates(true);

  // Register command for manual update checks (Ctrl+Shift+P -> Check for Updates)
  context.subscriptions.push(
    vscode.commands.registerCommand('magerProject.checkUpdate', () => {
      updateManager.checkForUpdates(false);
    })
  );

  // =========================================================
  // 2. SIDEBAR PROVIDER
  // =========================================================
  const provider = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      provider
    )
  );

  // =========================================================
  // 3. QUICK COPY (CONTEXT MENU)
  // =========================================================
  context.subscriptions.push(
    vscode.commands.registerCommand('magerProject.quickCopy', async (uri: vscode.Uri) => {
      if (!uri) {return;}

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Folder Snapshot...",
        cancellable: false
      }, async () => {
        try {
            // A. Scan the target folder
            // Using targetPath ensures we only scan the folder that was right-clicked
            const { root, skippedFiles } = await scanWorkspace({
                targetPath: uri.fsPath,
                useGitIgnore: true,      
                excludeSensitive: true    
            });

            if (!root) {
                vscode.window.showWarningMessage("Mager Project: Folder is empty or ignored.");
                return;
            }

            // B. Build Snapshot
            // Default to 'markdown' format for quick copy actions
            const snapshot = await buildSnapshot(root, 'markdown');

            // C. Copy to Clipboard
            await vscode.env.clipboard.writeText(snapshot);

            // D. Success Notification + Token Estimate
            // Limit is set to 0 just to calculate the total without validation
            const estimate = estimateTokens(snapshot, 0); 
            
            let message = `Copied! (~${estimate.tokens.toLocaleString()} tokens)`;
            
            if (skippedFiles.length > 0) {
                message += `. Ignored ${skippedFiles.length} large files (>1MB).`;
            }
            
            vscode.window.showInformationMessage(message);

        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Mager Project: Failed to copy snapshot.");
        }
      });
    })
  );
}

/**
 * Deactivates the extension.
 * * This function is called when the extension is disabled or uninstalled.
 * Currently, no specific cleanup is required.
 */
export function deactivate(): void {}