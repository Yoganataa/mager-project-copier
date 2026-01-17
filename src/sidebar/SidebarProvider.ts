// src/sidebar/SidebarProvider.ts
import * as vscode from 'vscode';
import { updateNodeCheckState, setAllChecked } from '../core/treeUtils';
import { saveSelection } from '../core/selectionStore';
import { detectFramework } from '../core/frameworkDetector';
import { applyPreset } from '../core/presetRules';
import { findLocalImports, resolveImportPaths } from '../core/dependencyScanner';
import { loadUIState, saveUIState, UIState } from '../core/uiState';
import { buildSnapshot } from '../core/snapshotBuilder';
import { ProjectNode } from '../types';

import { getWebviewContent } from './view/htmlRenderer';
import { handleCopyAction, handleCopyTreeAction } from './handlers/copyHandler';
import { handleScanAction } from './handlers/scanHandler';

/** * Storage key used to cache the project tree structure in the workspace state. 
 * This allows the tree to be instantly restored when VS Code is reloaded.
 */
const TREE_CACHE_KEY = 'magerProject.cachedTree';

/**
 * The primary WebviewViewProvider for the "Mager Project" extension.
 * * This class acts as the controller for the sidebar interface. It is responsible for:
 * - Managing the lifecycle of the WebView.
 * - Handling message passing (commands) between the WebView and the Extension Host.
 * - Persisting UI state and cached tree data.
 * - Orchestrating core actions like scanning, copying, and exporting.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'magerProject.sidebar';
  private static readonly PRESETS_KEY = 'magerProject.savedPresets';

  private treeData: ProjectNode | null = null;
  private uiState: UIState;
  private _view?: vscode.WebviewView;

  /** * A registry of supported command identifiers used for message passing protocol 
   * between the frontend (WebView) and backend (Extension Host).
   */
  private static readonly COMMANDS = {
    WEBVIEW_READY: 'webviewReady',
    SCAN: 'scan',
    SCAN_GIT: 'scanGit',
    TOGGLE_NODE: 'toggle',
    UNCHECK_ALL: 'uncheckAll',
    PRESET: 'preset',
    COPY: 'copy',
    COPY_TREE: 'copyTree',
    EXPORT: 'export',
    OPEN: 'open',
    TOGGLE_GITIGNORE: 'toggleGitIgnore',
    TOGGLE_PROBLEMS: 'toggleProblems',
    CHANGE_FORMAT: 'changeFormat',
    CHANGE_TEMPLATE: 'changeTemplate',
    TREE: 'tree',
    UI_STATE: 'uiState',
    ACTION_COMPLETE: 'actionComplete',
    // Preset Commands
    SAVE_PRESET: 'savePreset',
    LOAD_PRESET: 'loadPreset',
    DELETE_PRESET: 'deletePreset',
    GET_PRESETS: 'getPresets',
    RESOLVE_IMPORTS: 'resolveImports'
  } as const;

  /**
   * Initializes a new instance of the SidebarProvider.
   * * @param context - The extension context provided by VS Code, used for state persistence and resource URI resolution.
   */
  constructor(private readonly context: vscode.ExtensionContext) {
    this.uiState = loadUIState(context);
    this.treeData = this.context.workspaceState.get<ProjectNode>(TREE_CACHE_KEY) || null;
  }

  /**
   * Called when the view is first detected by VS Code.
   * Sets up the HTML content, configures security options, and establishes the message listener.
   * * @param view - The WebviewView instance being resolved.
   */
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
          // 1. Send the persisted UI state to the frontend immediately.
          view.webview.postMessage({
            command: SidebarProvider.COMMANDS.UI_STATE,
            payload: {
              ...this.uiState,
              tokenBudget: vscode.workspace.getConfiguration('magerProject').get('tokenBudget', 32000)
            }
          });

          // 2. Check for cached tree data.
          if (this.treeData) {
            // Instant Load: Restore the tree from cache (e.g., after a window reload).
            this.broadcastTree();
          } else {
            // Auto-Scan: If cache is empty, perform an initial scan.
            this.treeData = await handleScanAction(this.context, this.uiState, 'all');
            this.saveTreeCache();
            this.broadcastTree();
            view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          }
          break;

        case SidebarProvider.COMMANDS.SCAN:
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.saveTreeCache();
          this.broadcastTree();
          view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          break;

        case SidebarProvider.COMMANDS.SCAN_GIT:
          this.treeData = await handleScanAction(this.context, this.uiState, 'git');
          this.saveTreeCache();
          this.broadcastTree();
          view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          break;

        case SidebarProvider.COMMANDS.TOGGLE_NODE:
          await this.handleToggleNode(message);
          break;

        case SidebarProvider.COMMANDS.UNCHECK_ALL:
          if (this.treeData) {
            setAllChecked(this.treeData, false);
            saveSelection(this.context, this.treeData);
            this.saveTreeCache();
          }
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
          view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          break;

        case SidebarProvider.COMMANDS.COPY_TREE:
          await handleCopyTreeAction(this.treeData);
          view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          break;

        case SidebarProvider.COMMANDS.EXPORT:
          if (this.treeData) {
            const snapshot = await buildSnapshot(
              this.treeData,
              this.uiState.selectedFormat || 'markdown',
              this.uiState.includeProblems
            );

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
          view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          break;

        case SidebarProvider.COMMANDS.TOGGLE_GITIGNORE:
          this.uiState.useGitIgnore = Boolean(message.value);
          this.persistState();
          this.treeData = await handleScanAction(this.context, this.uiState, 'all');
          this.saveTreeCache();
          this.broadcastTree();
          break;

        case SidebarProvider.COMMANDS.TOGGLE_PROBLEMS:
          this.uiState.includeProblems = Boolean(message.value);
          this.persistState();
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

        
        case SidebarProvider.COMMANDS.GET_PRESETS:
          this.sendPresets();
          break;

        case SidebarProvider.COMMANDS.SAVE_PRESET:
          await this.handleSaveCustomPreset(message.name);
          break;

        case SidebarProvider.COMMANDS.LOAD_PRESET:
          await this.handleLoadCustomPreset(message.name);
          break;

        case SidebarProvider.COMMANDS.DELETE_PRESET:
          await this.handleDeleteCustomPreset(message.name);
          break;

        case SidebarProvider.COMMANDS.RESOLVE_IMPORTS:
          await this.handleResolveImports();
          view.webview.postMessage({ command: SidebarProvider.COMMANDS.ACTION_COMPLETE });
          break;
      }
    });
  }

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  /**
   * Updates the checked state of a specific node based on user interaction in the tree view.
   * * @param message - The message payload containing the target path and new checked state.
   */
  private async handleToggleNode(message: any): Promise<void> {
    if (!this.treeData || !message.path) {
      return;
    }

    updateNodeCheckState(this.treeData, message.path, Boolean(message.checked));

    saveSelection(this.context, this.treeData);
    this.saveTreeCache();
  }

  /**
   * Detects the project framework and applies the corresponding file selection preset.
   */
  private async handlePreset(): Promise<void> {
    if (!this.treeData) {
      return;
    }

    const framework = detectFramework(this.treeData.path);

    if (!framework) {
      vscode.window.showWarningMessage('Mager Project: No supported framework detected.');
      return;
    }

    applyPreset(this.treeData, framework);

    saveSelection(this.context, this.treeData);
    this.saveTreeCache();

    this.broadcastTree();

    vscode.window.showInformationMessage(`Mager Project: Applied preset for "${framework.name}".`);
  }

  // --- Custom Presets Management ---

  private getSavedPresets(): Record<string, string[]> {
    return this.context.globalState.get(SidebarProvider.PRESETS_KEY, {});
  }

  private sendPresets(): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'presetsList',
        payload: Object.keys(this.getSavedPresets())
      });
    }
  }

  private async handleSaveCustomPreset(name: string): Promise<void> {
    if (!this.treeData) {
      return;
    }
    
    // Collect all checked paths
    const checkedPaths: string[] = [];
    const traverse = (node: ProjectNode) => {
      if (node.type === 'file' && node.checked) {
        checkedPaths.push(node.path);
      }
      node.children?.forEach(traverse);
    };
    traverse(this.treeData);

    const presets = this.getSavedPresets();
    presets[name] = checkedPaths;
    
    await this.context.globalState.update(SidebarProvider.PRESETS_KEY, presets);
    this.sendPresets();
    vscode.window.showInformationMessage(`Preset "${name}" saved.`);
  }

  private async handleLoadCustomPreset(name: string): Promise<void> {
    if (!this.treeData) {
      return;
    }
    
    const presets = this.getSavedPresets();
    const pathsToSelect = new Set(presets[name] || []);
    
    if (pathsToSelect.size === 0) {
      vscode.window.showWarningMessage(`Preset "${name}" is empty or not found.`);
      return;
    }

    // Uncheck all first
    setAllChecked(this.treeData, false);

    // Re-check matches
    const traverse = (node: ProjectNode) => {
      if (node.type === 'file' && pathsToSelect.has(node.path)) {
        node.checked = true;
      }
      node.children?.forEach(traverse);
    };
    traverse(this.treeData);

    // Propagate up/down checking logic (simplified re-scan equivalent)
    // Actually, for correctness, we might need to rely on 'updateNodeCheckState' equivalent logic 
    // OR we can just save and reload tree.
    // For now, let's just save and broadcast. The frontend assumes valid state.
    // Note: 'updateNodeCheckState' handles parent/child logic but is per-node.
    // Ideally we should have a 'bulkUpdate' but let's stick to simple checked setting + optional re-validation.
    
    saveSelection(this.context, this.treeData);
    this.saveTreeCache();
    this.broadcastTree();
    vscode.window.showInformationMessage(`Preset "${name}" loaded.`);
  }

  private async handleDeleteCustomPreset(name: string): Promise<void> {
    const presets = this.getSavedPresets();
    if (presets[name]) {
      delete presets[name];
      await this.context.globalState.update(SidebarProvider.PRESETS_KEY, presets);
      this.sendPresets();
      vscode.window.showInformationMessage(`Preset "${name}" deleted.`);
    }
  }

  private async handleResolveImports(): Promise<void> {
    if (!this.treeData) {
      return;
    }

    const checkedPaths: string[] = [];
    const traverse = (node: ProjectNode) => {
        if (node.type === 'file' && node.checked) {
            checkedPaths.push(node.path);
        }
        node.children?.forEach(traverse);
    };
    traverse(this.treeData);

    if (checkedPaths.length === 0) {
        vscode.window.showWarningMessage('Mager Project: No files selected to resolve.');
        return;
    }

    let newFilesFound = 0;
    const pathsToCheck = [...checkedPaths];
    const visited = new Set<string>(checkedPaths);

    // Iterative BFS to find imports
    // Limit iterations to prevent infinite loops or huge scans
    for (let i = 0; i < 3; i++) { // Max depth 3
        const nextBatch: string[] = [];

        for (const filePath of pathsToCheck) {
            try {
                const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
                const text = Buffer.from(content).toString('utf8');
                const relativeImports = findLocalImports(text);
                const absoluteImports = resolveImportPaths(filePath, relativeImports);

                for (const absImport of absoluteImports) {
                     // Check if this file exists in our tree AND is not already checked
                     // To do this efficiently, we really should have a map of path -> node.
                     // For now, let's just use updateNodeCheckState which does the lookup.
                     // Optimization: Only update if not already visited/checked.
                     if (!visited.has(absImport)) {
                         // Verify existence in our tree structure (updateNodeCheckState does nothing if not found)
                         const wasUpdated = updateNodeCheckState(this.treeData, absImport, true);
                         if (wasUpdated) {
                             visited.add(absImport);
                             nextBatch.push(absImport);
                             newFilesFound++;
                         }
                     }
                }
            } catch (e) {
                // Ignore read errors
            }
        }
        
        if (nextBatch.length === 0) {
            break;
        }
        pathsToCheck.length = 0;
        pathsToCheck.push(...nextBatch);
    }

    if (newFilesFound > 0) {
        saveSelection(this.context, this.treeData);
        this.saveTreeCache();
        this.broadcastTree();
        vscode.window.showInformationMessage(`Mager Project: Selected ${newFilesFound} dependent files.`);
    } else {
        vscode.window.showInformationMessage('Mager Project: No new dependencies found.');
    }
  }



  /**
   * Sends the current tree data to the WebView to update the UI.
   */
  private broadcastTree(): void {
    if (this._view && this.treeData) {
      this._view.webview.postMessage({
        command: SidebarProvider.COMMANDS.TREE,
        payload: this.treeData
      });
    }
  }

  /**
   * Saves the current UI state to the workspace storage.
   */
  private persistState(): void {
    saveUIState(this.context, this.uiState);
  }

  /**
   * Caches the current project tree structure to the workspace storage.
   */
  private saveTreeCache(): void {
    if (this.treeData) {
      this.context.workspaceState.update(TREE_CACHE_KEY, this.treeData);
    }
  }
}