// src/sidebar/view/htmlRenderer.ts
import { AI_MODELS } from '../../data/constants';
import { getTemplates } from '../../core/templateManager';

/**
 * Generates the complete HTML content for the extension's sidebar Webview.
 * * This includes:
 * - CSS styles for the VS Code-native look and feel.
 * - The HTML structure for controls (dropdowns, buttons, search box).
 * - Embedded JavaScript for handling UI interactions (search filtering, tree rendering, message passing).
 *
 * @returns A string containing the full HTML document.
 */
export function getWebviewContent(): string {
  const formatLimit = (num: number) => {
    if (num >= 1000000) {return (num / 1000000).toFixed(1).replace('.0', '') + 'M';}
    if (num >= 1000) {return (num / 1000).toFixed(0) + 'k';}
    return num.toString();
  };

  const modelOptions = AI_MODELS.map(m =>
    `<option value="${m.id}">${m.name} (${formatLimit(m.limit)})</option>`
  ).join('');

  const templateOptions = getTemplates().map(t =>
    `<option value="${t.id}" title="${t.description}">${t.label}</option>`
  ).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: var(--vscode-font-family); padding: 10px; }
    h3 { margin-top: 0; margin-bottom: 8px; }
    button, select, input[type="text"] {
      width: 100%; margin-bottom: 8px; padding: 6px;
      background: var(--vscode-button-background); color: var(--vscode-button-foreground);
      border: none; cursor: pointer; border-radius: 2px;
      box-sizing: border-box; 
    }
    
    input[type="text"] {
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      cursor: text;
      margin-bottom: 12px;
    }
    input[type="text"]:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    select {
      background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border); outline: none;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    label { display: block; font-size: 12px; margin-bottom: 4px; cursor: pointer; color: var(--vscode-foreground); }
    .section-title {
        font-size: 11px; font-weight: bold; text-transform: uppercase;
        margin-top: 12px; margin-bottom: 6px; opacity: 0.8;
    }
    .item { white-space: nowrap; user-select: none; }
    
    .scan-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
    }
  </style>
</head>
<body>
  <h3>Mager Project</h3>

  <div class="section-title">1. Target Model</div>
  <select id="modelSelect">${modelOptions}</select>

  <div class="section-title">2. Prompt Template</div>
  <select id="templateSelect">${templateOptions}</select>

  <div class="section-title">3. Actions</div>
  
  <div class="scan-grid">
    <button id="scan" title="Scan entire workspace">Scan All</button>
    <button id="scanGit" title="Scan only modified/new files" style="background: var(--vscode-gitDecoration-modifiedResourceForeground); color: var(--vscode-editor-background);">Scan Git</button>
  </div>
  
  <button id="preset">Apply Smart Preset</button>
  
  <div style="margin: 10px 0;">
    <label title="Respect .gitignore"><input type="checkbox" id="gitignore" /> Use .gitignore</label>
    <label title="Hide secrets"><input type="checkbox" id="sensitive" /> Exclude sensitive files</label>
  </div>

  <button id="copy">Copy Snapshot</button>
  <button id="export">Export Snapshot</button>

  <hr style="border: 0; border-top: 1px solid var(--vscode-widget-border); margin: 15px 0;" />
  
  <input type="text" id="searchBox" placeholder="Filter files..." />

  <div id="tree"></div>

  <script>
    const vscode = acquireVsCodeApi();
    const treeEl = document.getElementById('tree');
    const modelSelect = document.getElementById('modelSelect');
    const templateSelect = document.getElementById('templateSelect');
    const searchBox = document.getElementById('searchBox');

    // -- SMART SEARCH LOGIC --
    searchBox.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.item');
        
        if (!term) {
            items.forEach(item => item.style.display = 'block');
            return;
        }

        // 1. Identify Matching Paths (Visible Paths)
        // We use a Set to store the matching file path AND all its parent paths
        const visiblePaths = new Set();

        items.forEach(item => {
            const text = item.textContent.trim().toLowerCase();
            const fullPath = item.getAttribute('data-path'); 

            if (text.includes(term) && fullPath) {
                // Add this specific file's path
                visiblePaths.add(fullPath);

                // Add all parent paths to ensure the folder structure remains visible
                let current = fullPath;
                while (true) {
                    const lastSlash = Math.max(current.lastIndexOf('/'), current.lastIndexOf('\\\\'));
                    if (lastSlash < 0) break;
                    
                    current = current.substring(0, lastSlash);
                    if (current) visiblePaths.add(current);
                }
            }
        });

        // 2. Apply Visibility
        items.forEach(item => {
            const path = item.getAttribute('data-path');
            // Show ONLY if this path exists in the visiblePaths Set
            if (visiblePaths.has(path)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // -- Event Listeners --
    
    modelSelect.onchange = (e) => vscode.postMessage({ command: 'changeModel', value: e.target.value });
    templateSelect.onchange = (e) => vscode.postMessage({ command: 'changeTemplate', value: e.target.value });

    document.getElementById('scan').onclick = () => vscode.postMessage({ command: 'scan' });
    document.getElementById('scanGit').onclick = () => vscode.postMessage({ command: 'scanGit' });
    document.getElementById('preset').onclick = () => vscode.postMessage({ command: 'preset' });
    document.getElementById('copy').onclick = () => vscode.postMessage({ command: 'copy' });
    document.getElementById('export').onclick = () => vscode.postMessage({ command: 'export' });
    
    document.getElementById('gitignore').onchange = e => vscode.postMessage({ command: 'toggleGitIgnore', value: e.target.checked });
    document.getElementById('sensitive').onchange = e => vscode.postMessage({ command: 'toggleSensitive', value: e.target.checked });

    // -- Message Handling --
    
    window.addEventListener('message', event => {
      if (event.data.command === 'uiState') {
        const s = event.data.payload;
        document.getElementById('gitignore').checked = s.useGitIgnore;
        document.getElementById('sensitive').checked = s.excludeSensitive;
        if (s.selectedModel) modelSelect.value = s.selectedModel;
        if (s.selectedTemplate) templateSelect.value = s.selectedTemplate;
      }
      
      if (event.data.command === 'tree') {
        treeEl.innerHTML = '';
        renderNode(event.data.payload, treeEl);
        searchBox.value = '';
      }
    });

    // -- Render Node --
    function renderNode(node, container, depth = 0) {
      if (!node) return;
      const row = document.createElement('div');
      row.className = 'item';
      row.style.marginLeft = (depth * 14) + 'px';
      
      // IMPORTANT: Store original path in data-attribute for the Search Logic
      row.setAttribute('data-path', node.path); 
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = node.checked;
      checkbox.onchange = () => vscode.postMessage({ command: 'toggle', path: node.path, checked: checkbox.checked });
      
      row.appendChild(checkbox);
      
      const label = document.createElement('span');
      label.textContent = ' ' + node.name;
      if (node.type === 'directory') label.style.fontWeight = 'bold';
      
      row.appendChild(label);
      container.appendChild(row);
      
      if (node.children) {
          node.children.forEach(c => renderNode(c, container, depth + 1));
      }
    }
  </script>
</body>
</html>
  `;
}