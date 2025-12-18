// src/sidebar/SidebarProvider.ts
import * as vscode from 'vscode';
import { updateNodeCheckState } from '../core/treeUtils';
import { saveSelection } from '../core/selectionStore';
import { detectFramework } from '../core/frameworkDetector';
import { applyPreset } from '../core/presetRules';
import { loadUIState, saveUIState, UIState } from '../core/uiState';
import { buildSnapshot } from '../core/snapshotBuilder';
import { ProjectNode } from '../types';

import { getWebviewContent } from './view/htmlRenderer';
import { handleCopyAction } from './handlers/copyHandler';
import { handleScanAction } from './handlers/scanHandler';

/**
 * The primary WebviewViewProvider for the "Mager Project" extension.
 * * This class manages the sidebar UI, handles communication between the Webview and the Extension Host,
 * and coordinates actions such as scanning, token estimation, and snapshot generation.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'magerProject.sidebar';

  private treeData: ProjectNode | null = null;
  private uiState: UIState;

  /**
   * Registry of supported commands used for message passing between the Webview and Extension.
   */
  private static readonly COMMANDS = {
    SCAN: 'scan',
    SCAN_GIT: 'scanGit',
    TOGGLE_NODE: 'toggle',
    PRESET: 'preset',
    COPY: 'copy',
    EXPORT: 'export',
    TOGGLE_GITIGNORE: 'toggleGitIgnore',
    TOGGLE_SENSITIVE: 'toggleSensitive',
    CHANGE_MODEL: 'changeModel',
    CHANGE_TEMPLATE: 'changeTemplate',
    TREE: 'tree',
    UI_STATE: 'uiState'
  } as const;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.uiState = loadUIState(context);
  }

  /**
   * Invoked when the Webview is first created.
   * * Sets up the HTML content, initializes the state, and establishes message listeners.
   *
   * @param view - The WebviewView instance provided by VS Code.
   */
  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true };
    
    view.webview.html = getWebviewContent();

    // Send initial state to the Webview
    view.webview.postMessage({
      command: SidebarProvider.COMMANDS.UI_STATE,
      payload: this.uiState
    });

    view.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        
        // CASE: Full Workspace Scan
        case SidebarProvider.COMMANDS.SCAN:
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.broadcastTree(view);
          break;

        // CASE: Git-Only Scan (Modified Files)
        case SidebarProvider.COMMANDS.SCAN_GIT:
          this.treeData = await handleScanAction(this.context, this.uiState, 'git');
          this.broadcastTree(view);
          break;

        // CASE: Checkbox Toggle
        case SidebarProvider.COMMANDS.TOGGLE_NODE:
          await this.handleToggleNode(view, message);
          break;

        // CASE: Apply Framework Preset
        case SidebarProvider.COMMANDS.PRESET:
          await this.handlePreset(view);
          break;

        // CASE: Copy Snapshot to Clipboard
        case SidebarProvider.COMMANDS.COPY:
          await handleCopyAction(this.treeData, this.uiState);
          break;

        // CASE: Export Snapshot to File
        case SidebarProvider.COMMANDS.EXPORT:
          await this.handleExport();
          break;

        // === UI STATE UPDATES ===
        case SidebarProvider.COMMANDS.TOGGLE_GITIGNORE:
          this.uiState.useGitIgnore = Boolean(message.value);
          this.persistState();
          // Auto re-scan to reflect the new ignore rule
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.broadcastTree(view);
          break;

        case SidebarProvider.COMMANDS.TOGGLE_SENSITIVE:
          this.uiState.excludeSensitive = Boolean(message.value);
          this.persistState();
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.broadcastTree(view);
          break;

        case SidebarProvider.COMMANDS.CHANGE_MODEL:
          this.uiState.selectedModel = message.value;
          this.persistState();
          break;

        case SidebarProvider.COMMANDS.CHANGE_TEMPLATE:
          this.uiState.selectedTemplate = message.value;
          this.persistState();
          break;
      }
    });
  }

  // ======================================================
  // Internal Handlers
  // ======================================================

  /**
   * Updates the checked state of a specific node and syncs the tree.
   */
  private async handleToggleNode(view: vscode.WebviewView, message: any): Promise<void> {
    if (!this.treeData || !message.path) {return;}
    updateNodeCheckState(this.treeData, message.path, Boolean(message.checked));
    saveSelection(this.context, this.treeData);
    this.broadcastTree(view);
  }

  /**
   * Detects the project framework and applies the corresponding selection preset.
   */
  private async handlePreset(view: vscode.WebviewView): Promise<void> {
    if (!this.treeData) {return;}
    const framework = detectFramework(this.treeData.path);
    if (framework === 'unknown') {
      vscode.window.showWarningMessage('Mager Project: Framework not detected.');
      return;
    }
    applyPreset(this.treeData, framework);
    saveSelection(this.context, this.treeData);
    this.broadcastTree(view);
    vscode.window.showInformationMessage(`Mager Project: "${framework}" preset applied.`);
  }

  /**
   * Generates a snapshot and prompts the user to save it as a file.
   */
  private async handleExport(): Promise<void> {
    if (!this.treeData) {return;}
    
    const snapshot = await buildSnapshot(this.treeData, 'markdown'); 
    const uri = await vscode.window.showSaveDialog({ 
        filters: { Markdown: ['md'], Text: ['txt'] },
        title: 'Export Project Snapshot'
    });
    
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(snapshot));
      vscode.window.showInformationMessage('Export successful.');
    }
  }

  /**
   * Sends the updated tree structure to the Webview for rendering.
   */
  private broadcastTree(view: vscode.WebviewView): void {
    if (this.treeData) {
        view.webview.postMessage({ 
            command: SidebarProvider.COMMANDS.TREE, 
            payload: this.treeData 
        });
    }
  }

  /**
   * Persists the current UI state to the workspace storage.
   */
  private persistState(): void {
      saveUIState(this.context, this.uiState);
  }
}