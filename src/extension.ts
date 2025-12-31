// src/extension.ts
import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { scanWorkspace } from './core/fileScanner';
import { buildSnapshot } from './core/snapshotBuilder';
import { estimateTokens } from './core/tokenEstimator';
import { UpdateManager } from './core/updateManager';

/**
 * The main entry point for the extension.
 * * This function is invoked by VS Code when the extension is activated. It is responsible for:
 * 1. Initializing the self-update mechanism via GitHub Releases.
 * 2. Registering the Sidebar Webview Provider.
 * 3. Registering context menu commands for quick actions.
 * * @param context - The {@link vscode.ExtensionContext} provided by the Extension Host.
 */
export function activate(context: vscode.ExtensionContext): void {
  // --- Auto-Update Configuration ---
  const GITHUB_REPO = 'yoganataa/mager-project-copier'; 
  const updateManager = new UpdateManager(context, GITHUB_REPO);
  
  updateManager.checkForUpdates(true);

  context.subscriptions.push(
    vscode.commands.registerCommand('magerProject.checkUpdate', () => {
      updateManager.checkForUpdates(false);
    })
  );

  // --- Sidebar Provider Registration ---
  const provider = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      provider
    )
  );

  // --- Context Menu Command: Quick Copy ---
  context.subscriptions.push(
    vscode.commands.registerCommand('magerProject.quickCopy', async (uri: vscode.Uri) => {
      if (!uri) {return;}

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Folder Snapshot...",
        cancellable: false
      }, async () => {
        try {
            const { root } = await scanWorkspace({
                targetPath: uri.fsPath,
                useGitIgnore: true,       
                excludeSensitive: true     
            });

            if (!root) {
                vscode.window.showWarningMessage("Mager Project: Folder is empty or ignored.");
                return;
            }

            const snapshot = await buildSnapshot(root, 'markdown');

            await vscode.env.clipboard.writeText(snapshot);

            const estimate = estimateTokens(snapshot, 0); 
            
            vscode.window.showInformationMessage(
                `Copied! (~${estimate.tokens.toLocaleString()} tokens)`
            );

        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Mager Project: Failed to copy snapshot.");
        }
      });
    })
  );
}

/**
 * Performs necessary cleanup when the extension is deactivated.
 * * This function is called when the extension is disabled or uninstalled.
 */
export function deactivate(): void {}