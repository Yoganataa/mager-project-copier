// src/sidebar/SidebarProvider.ts
import * as vscode from 'vscode';
import { scanWorkspace } from '../core/fileScanner';
import { buildSnapshot } from '../core/snapshotBuilder';
import { updateNodeCheckState } from '../core/treeUtils';
import { saveSelection, restoreSelection } from '../core/selectionStore';
import { detectFramework } from '../core/frameworkDetector';
import { applyPreset } from '../core/presetRules';
import { loadUIState, saveUIState, UIState } from '../core/uiState';
import { estimateTokens } from '../core/tokenEstimator';
import { splitSnapshot } from '../core/snapshotSplitter';
import { ProjectNode } from '../types';

/**
 * Sidebar webview provider for Mager Project.
 * Final production-ready version.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'magerProject.sidebar';

  private static readonly DEFAULT_TOKEN_LIMIT = 128_000;

  private treeData: ProjectNode | null = null;
  private uiState: UIState;

  private static readonly COMMANDS = {
    SCAN: 'scan',
    TOGGLE_NODE: 'toggle',
    PRESET: 'preset',
    COPY: 'copy',
    EXPORT: 'export',
    TOGGLE_GITIGNORE: 'toggleGitIgnore',
    TOGGLE_SENSITIVE: 'toggleSensitive',
    TREE: 'tree',
    UI_STATE: 'uiState'
  } as const;

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {
    this.uiState = loadUIState(context);
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getHtml();

    // Restore persisted UI state
    view.webview.postMessage({
      command: SidebarProvider.COMMANDS.UI_STATE,
      payload: this.uiState
    });

    view.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case SidebarProvider.COMMANDS.SCAN:
          await this.handleScan(view);
          break;

        case SidebarProvider.COMMANDS.TOGGLE_NODE:
          await this.handleToggleNode(view, message);
          break;

        case SidebarProvider.COMMANDS.PRESET:
          await this.handlePreset(view);
          break;

        case SidebarProvider.COMMANDS.COPY:
          await this.handleCopy();
          break;

        case SidebarProvider.COMMANDS.EXPORT:
          await this.handleExport();
          break;

        case SidebarProvider.COMMANDS.TOGGLE_GITIGNORE:
          this.uiState.useGitIgnore = Boolean(message.value);
          saveUIState(this.context, this.uiState);
          await this.handleScan(view);
          break;

        case SidebarProvider.COMMANDS.TOGGLE_SENSITIVE:
          this.uiState.excludeSensitive = Boolean(message.value);
          saveUIState(this.context, this.uiState);
          await this.handleScan(view);
          break;
      }
    });
  }

  // ======================================================
  // Handlers
  // ======================================================

  private async handleScan(
    view: vscode.WebviewView
  ): Promise<void> {
    this.treeData = await scanWorkspace({
      useGitIgnore: this.uiState.useGitIgnore,
      excludeSensitive: this.uiState.excludeSensitive
    });

    if (!this.treeData) {
      vscode.window.showWarningMessage(
        'Mager Project: no workspace detected'
      );
      return;
    }

    restoreSelection(this.context, this.treeData);

    view.webview.postMessage({
      command: SidebarProvider.COMMANDS.TREE,
      payload: this.treeData
    });
  }

  private async handleToggleNode(
    view: vscode.WebviewView,
    message: { path?: string; checked?: boolean }
  ): Promise<void> {
    if (!this.treeData || !message.path) {
      return;
    }

    updateNodeCheckState(
      this.treeData,
      message.path,
      Boolean(message.checked)
    );

    saveSelection(this.context, this.treeData);

    view.webview.postMessage({
      command: SidebarProvider.COMMANDS.TREE,
      payload: this.treeData
    });
  }

  private async handlePreset(
    view: vscode.WebviewView
  ): Promise<void> {
    if (!this.treeData) {
      vscode.window.showWarningMessage(
        'Mager Project: scan project first'
      );
      return;
    }

    const framework = detectFramework(this.treeData.path);
    if (framework === 'unknown') {
      vscode.window.showWarningMessage(
        'Mager Project: framework not detected'
      );
      return;
    }

    applyPreset(this.treeData, framework);
    saveSelection(this.context, this.treeData);

    view.webview.postMessage({
      command: SidebarProvider.COMMANDS.TREE,
      payload: this.treeData
    });

    vscode.window.showInformationMessage(
      `Mager Project: "${framework}" preset applied`
    );
  }

  private async handleCopy(): Promise<void> {
    if (!this.treeData) {
      vscode.window.showWarningMessage(
        'Mager Project: scan project first'
      );
      return;
    }

    const snapshot = await buildSnapshot(this.treeData);
    const estimate = estimateTokens(
      snapshot,
      SidebarProvider.DEFAULT_TOKEN_LIMIT
    );

    if (!estimate.withinLimit) {
      const choice = await vscode.window.showWarningMessage(
        `Snapshot too large (~${estimate.tokens.toLocaleString()} tokens).
AI limit is ${estimate.limit.toLocaleString()} tokens.`,
        'Split Snapshot',
        'Cancel'
      );

      if (choice !== 'Split Snapshot') {
        return;
      }

      const chunks = splitSnapshot(
        snapshot,
        SidebarProvider.DEFAULT_TOKEN_LIMIT
      );

      const combined = chunks
        .map(
          c => `# Part ${c.index}\n\n${c.content}`
        )
        .join('\n\n---\n\n');

      await vscode.env.clipboard.writeText(combined);

      vscode.window.showInformationMessage(
        `Mager Project: snapshot split into ${chunks.length} parts`
      );

      return;
    }

    await vscode.env.clipboard.writeText(snapshot);

    vscode.window.showInformationMessage(
      `Mager Project: snapshot copied (~${estimate.tokens.toLocaleString()} tokens)`
    );
  }

  private async handleExport(): Promise<void> {
    if (!this.treeData) {
      vscode.window.showWarningMessage(
        'Mager Project: scan project first'
      );
      return;
    }

    const snapshot = await buildSnapshot(this.treeData);

    const uri = await vscode.window.showSaveDialog({
      title: 'Export Project Snapshot',
      saveLabel: 'Export',
      filters: {
        Markdown: ['md'],
        Text: ['txt']
      }
    });

    if (!uri) {
      return;
    }

    await vscode.workspace.fs.writeFile(
      uri,
      Buffer.from(snapshot, 'utf8')
    );

    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      'Mager Project: snapshot exported successfully'
    );
  }

  // ======================================================
  // Webview HTML
  // ======================================================

  private getHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 10px;
    }
    h3 {
      margin-top: 0;
    }
    button {
      width: 100%;
      margin-bottom: 6px;
    }
    label {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
      cursor: pointer;
    }
    .item {
      white-space: nowrap;
      user-select: none;
    }
  </style>
</head>
<body>
  <h3>Mager Project</h3>

  <button id="scan">Scan Project</button>

  <label>
    <input type="checkbox" id="gitignore" />
    Use .gitignore (recommended)
  </label>

  <label>
    <input type="checkbox" id="sensitive" />
    Exclude sensitive files (.env, *.key)
  </label>

  <button id="preset">Apply Smart Preset</button>
  <button id="copy">Copy Snapshot</button>
  <button id="export">Export Snapshot</button>

  <div id="tree"></div>

  <script>
    const vscode = acquireVsCodeApi();
    const treeEl = document.getElementById('tree');

    document.getElementById('scan').onclick = () =>
      vscode.postMessage({ command: 'scan' });

    document.getElementById('preset').onclick = () =>
      vscode.postMessage({ command: 'preset' });

    document.getElementById('copy').onclick = () =>
      vscode.postMessage({ command: 'copy' });

    document.getElementById('export').onclick = () =>
      vscode.postMessage({ command: 'export' });

    document.getElementById('gitignore').onchange = e =>
      vscode.postMessage({
        command: 'toggleGitIgnore',
        value: e.target.checked
      });

    document.getElementById('sensitive').onchange = e =>
      vscode.postMessage({
        command: 'toggleSensitive',
        value: e.target.checked
      });

    window.addEventListener('message', event => {
      if (event.data.command === 'uiState') {
        document.getElementById('gitignore').checked =
          event.data.payload.useGitIgnore;
        document.getElementById('sensitive').checked =
          event.data.payload.excludeSensitive;
      }

      if (event.data.command === 'tree') {
        treeEl.innerHTML = '';
        renderNode(event.data.payload, treeEl);
      }
    });

    function renderNode(node, container, depth = 0) {
      if (!node) return;

      const row = document.createElement('div');
      row.className = 'item';
      row.style.marginLeft = (depth * 12) + 'px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = node.checked;

      checkbox.onchange = () => {
        vscode.postMessage({
          command: 'toggle',
          path: node.path,
          checked: checkbox.checked
        });
      };

      row.appendChild(checkbox);
      row.appendChild(
        document.createTextNode(' ' + node.name)
      );

      container.appendChild(row);

      if (node.children) {
        node.children.forEach(child =>
          renderNode(child, container, depth + 1)
        );
      }
    }
  </script>
</body>
</html>
    `;
  }
}
