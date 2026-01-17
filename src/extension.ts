// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { scanWorkspace } from './core/fileScanner';
import { buildSnapshot } from './core/snapshotBuilder';
import { estimateTokens } from './core/tokenEstimator';
import { UpdateManager } from './core/updateManager';
import { ProjectNode } from './types';

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
      if (!uri) { return; }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Folder Snapshot...",
        cancellable: false
      }, async () => {
        try {
          let root: ProjectNode | null = null;
          
          const stat = await vscode.workspace.fs.stat(uri);

          if (stat.type === vscode.FileType.Directory) {
             const result = await scanWorkspace({
               targetPath: uri.fsPath,
               useGitIgnore: true
             });
             root = result.root;
          } else {
             // Handle single file
             const parentPath = path.dirname(uri.fsPath);
             root = {
                 path: parentPath,
                 name: path.basename(parentPath),
                 type: 'directory',
                 checked: true,
                 children: [
                     {
                         path: uri.fsPath,
                         name: path.basename(uri.fsPath),
                         type: 'file',
                         checked: true
                     }
                 ]
             };
          }

          if (!root) {
            vscode.window.showWarningMessage("Mager Project: Target is empty or ignored.");
            return;
          }

          // Force includeProblems = true
          const snapshot = await buildSnapshot(root, 'markdown', true);

          await vscode.env.clipboard.writeText(snapshot);

          const estimate = estimateTokens(snapshot, 0);

          vscode.window.showInformationMessage(
            `Copied! (~${estimate.tokens.toLocaleString()} tokens) with Problems included.`
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
export function deactivate(): void { }