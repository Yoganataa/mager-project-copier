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
import { handleCopyAction, handleCopyTreeAction } from './handlers/copyHandler';
import { handleScanAction } from './handlers/scanHandler';

/** Storage key for caching the project tree structure in the workspace state. */
const TREE_CACHE_KEY = 'magerProject.cachedTree';

/**
 * The primary WebviewViewProvider for the "Mager Project" extension.
 * Manages UI state, data persistence, and communication between the Sidebar and Extension Host.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'magerProject.sidebar';

  private treeData: ProjectNode | null = null;
  private uiState: UIState;
  private _view?: vscode.WebviewView;

  /** Registry of supported commands used for message passing. */
  private static readonly COMMANDS = {
    WEBVIEW_READY: 'webviewReady',
    SCAN: 'scan',
    SCAN_GIT: 'scanGit',
    TOGGLE_NODE: 'toggle',
    PRESET: 'preset',
    COPY: 'copy',
    COPY_TREE: 'copyTree',
    EXPORT: 'export',
    OPEN: 'open',
    TOGGLE_GITIGNORE: 'toggleGitIgnore',
    TOGGLE_SENSITIVE: 'toggleSensitive',
    CHANGE_FORMAT: 'changeFormat', // Updated from CHANGE_MODEL
    CHANGE_TEMPLATE: 'changeTemplate',
    TREE: 'tree',
    UI_STATE: 'uiState'
  } as const;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.uiState = loadUIState(context);
    this.treeData = this.context.workspaceState.get<ProjectNode>(TREE_CACHE_KEY) || null;
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this._view = view;

    view.webview.options = { 
      enableScripts: true,
      localResourceRoots: [
        this.context.extensionUri,
        vscode.Uri.joinPath(this.context.extensionUri, 'assets') 
      ]
    };

    const iconBaseUri = view.webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'filetype')
    );

    view.webview.html = getWebviewContent(iconBaseUri);

    view.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        
        case SidebarProvider.COMMANDS.WEBVIEW_READY:
          view.webview.postMessage({
            command: SidebarProvider.COMMANDS.UI_STATE,
            payload: this.uiState
          });
          if (this.treeData) {
              this.broadcastTree();
          }
          break;

        case SidebarProvider.COMMANDS.SCAN:
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.saveTreeCache();
          this.broadcastTree();
          break;

        case SidebarProvider.COMMANDS.SCAN_GIT:
          this.treeData = await handleScanAction(this.context, this.uiState, 'git');
          this.saveTreeCache();
          this.broadcastTree();
          break;

        case SidebarProvider.COMMANDS.TOGGLE_NODE:
          await this.handleToggleNode(message);
          break;

        case SidebarProvider.COMMANDS.OPEN:
          if (message.path) {
            const uri = vscode.Uri.file(message.path);
            vscode.commands.executeCommand('vscode.open', uri);
          }
          break;

        case SidebarProvider.COMMANDS.PRESET:
          await this.handlePreset();
          break;

        case SidebarProvider.COMMANDS.COPY:
          await handleCopyAction(this.treeData, this.uiState);
          break;

        case SidebarProvider.COMMANDS.COPY_TREE:
          await handleCopyTreeAction(this.treeData);
          break;

        case SidebarProvider.COMMANDS.EXPORT:
          await this.handleExport();
          break;

        case SidebarProvider.COMMANDS.TOGGLE_GITIGNORE:
          this.uiState.useGitIgnore = Boolean(message.value);
          this.persistState();
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.saveTreeCache();
          this.broadcastTree();
          break;

        case SidebarProvider.COMMANDS.TOGGLE_SENSITIVE:
          this.uiState.excludeSensitive = Boolean(message.value);
          this.persistState();
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.saveTreeCache();
          this.broadcastTree();
          break;

        case SidebarProvider.COMMANDS.CHANGE_FORMAT:
          if (message.value === 'markdown' || message.value === 'xml') {
            this.uiState.selectedFormat = message.value;
            this.persistState();
          }
          break;

        case SidebarProvider.COMMANDS.CHANGE_TEMPLATE:
          this.uiState.selectedTemplate = message.value;
          this.persistState();
          break;
      }
    });
  }

  // Internal Helpers
  private async handleToggleNode(message: any): Promise<void> {
    if (!this.treeData || !message.path) {return;}
    updateNodeCheckState(this.treeData, message.path, Boolean(message.checked));
    
    saveSelection(this.context, this.treeData);
    this.saveTreeCache(); 
    this.broadcastTree();
  }

  private async handlePreset(): Promise<void> {
    if (!this.treeData) {return;}
    const framework = detectFramework(this.treeData.path);
    if (framework === 'unknown') {
      vscode.window.showWarningMessage('Mager Project: Framework not detected.');
      return;
    }
    applyPreset(this.treeData, framework);
    saveSelection(this.context, this.treeData);
    this.saveTreeCache();
    this.broadcastTree();
    vscode.window.showInformationMessage(`Mager Project: "${framework}" preset applied.`);
  }

  private async handleExport(): Promise<void> {
    if (!this.treeData) {return;}
    const snapshot = await buildSnapshot(this.treeData, this.uiState.selectedFormat || 'markdown'); 
    
    const ext = this.uiState.selectedFormat === 'xml' ? 'xml' : 'md';
    const uri = await vscode.window.showSaveDialog({ 
        filters: { 
            [ext.toUpperCase()]: [ext], 
            'Text': ['txt'] 
        },
        title: 'Export Project Snapshot'
    });
    
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(snapshot));
      vscode.window.showInformationMessage('Export successful.');
    }
  }

  private broadcastTree(): void {
    if (this._view && this.treeData) {
        this._view.webview.postMessage({ 
            command: SidebarProvider.COMMANDS.TREE, 
            payload: this.treeData 
        });
    }
  }

  private persistState(): void {
      saveUIState(this.context, this.uiState);
  }

  private saveTreeCache(): void {
      if (this.treeData) {
          this.context.workspaceState.update(TREE_CACHE_KEY, this.treeData);
      }
  }
}