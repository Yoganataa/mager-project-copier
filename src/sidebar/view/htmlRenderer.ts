// src/sidebar/view/htmlRenderer.ts
import { Uri } from 'vscode';
import { OUTPUT_FORMATS } from '../../data/constants'; // Make sure constants.ts exports OUTPUT_FORMATS
import { getTemplates } from '../../core/templateManager';
import { FILE_ICON_MAP, EXACT_FILE_MAP } from './iconMap';

export function getWebviewContent(iconBaseUri: Uri): string {
  const basePath = iconBaseUri.toString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  ${getStyles()}
</head>
<body>
  ${getToolbar()}
  ${getSettingsSection()}
  ${getTreeSection()}
  ${getFooterSection()}
  ${getScripts(basePath)}
</body>
</html>
  `;
}

// CSS STYLES
function getStyles(): string {
  return `
  <style>
    :root { --indent-guide-color: var(--vscode-tree-indentGuidesStroke); }
    body { font-family: var(--vscode-font-family); padding: 10px; padding-bottom: 40px; color: var(--vscode-foreground); font-size: 13px; }
    
    .hidden { display: none !important; }

    /* Highlight Class for Search Results */
    .highlight { 
        background-color: var(--vscode-editor-findMatchHighlightBackground); 
        color: inherit;
        border-radius: 2px;
    }

    /* Toolbar */
    .toolbar { display: flex; gap: 4px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--vscode-widget-border); }
    .icon-btn { flex: 1; display: flex; align-items: center; justify-content: center; height: 28px; background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-icon-foreground); border: 1px solid transparent; border-radius: 4px; cursor: pointer; opacity: 0.8; }
    .icon-btn:hover { opacity: 1; background: var(--vscode-toolbar-activeBackground); }
    
    .icon-btn svg, .twistie svg { pointer-events: none; }
    .icon-btn svg { width: 18px; height: 18px; fill: currentColor; }
    
    #scanGit { color: var(--vscode-gitDecoration-modifiedResourceForeground); }

    /* Inputs */
    select, input[type="text"] { width: 100%; margin-bottom: 8px; padding: 4px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); border-radius: 2px; outline: none; }
    input[type="text"] { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
    input[type="text"]:focus { outline: 1px solid var(--vscode-focusBorder); }
    label { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; cursor: pointer; opacity: 0.9; }
    
    /* Primary Actions - 3 columns */
    .primary-actions { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px; margin-top: 12px; }
    .big-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 6px; border: none; border-radius: 2px; cursor: pointer; font-size: 12px; }
    .big-btn:hover { background: var(--vscode-button-hoverBackground); }
    
    .secondary-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .secondary-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }

    /* Tree View */
    #tree { margin-top: 10px; padding-left: 0; }
    .node-wrapper { display: block; }
    
    /* Row Styles & Keyboard Focus */
    .row { display: flex; align-items: center; height: 22px; white-space: nowrap; user-select: none; cursor: pointer; padding-right: 4px; border: 1px solid transparent; }
    .row:hover { background-color: var(--vscode-list-hoverBackground); }
    .row:focus { outline: 1px solid var(--vscode-focusBorder); outline-offset: -1px; background-color: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    
    .children-container { margin-left: 10px; padding-left: 10px; border-left: 1px solid transparent; }
    .children-container:hover { border-left-color: var(--indent-guide-color); }
    
    .twistie { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: var(--vscode-icon-foreground); transition: transform 0.1s ease-in-out; flex-shrink: 0; }
    .twistie.expanded { transform: rotate(90deg); }
    .twistie.hidden-arrow { visibility: hidden; }

    input[type="checkbox"] { margin: 0 6px 0 0; }
    .node-label { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; line-height: 22px; }
    .file-link:hover { text-decoration: underline; color: var(--vscode-textLink-foreground); }
    .icon-img { width: 16px; height: 16px; margin-right: 6px; flex-shrink: 0; display: block; }

    .sticky-footer { position: fixed; bottom: 0; left: 0; right: 0; background: var(--vscode-sideBar-background); border-top: 1px solid var(--vscode-widget-border); padding: 6px 15px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; z-index: 999; }
  </style>
  `;
}

// HTML COMPONENTS

function getToolbar(): string {
  const ICON_SCAN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 22V20H20V17H22V20.5C22 20.89 21.84 21.24 21.54 21.54C21.24 21.84 20.89 22 20.5 22H17M7 22H3.5C3.11 22 2.76 21.84 2.46 21.54C2.16 21.24 2 20.89 2 20.5V17H4V20H7V22M17 2H20.5C20.89 2 21.24 2.16 21.54 2.46C21.84 2.76 22 3.11 22 3.5V7H20V4H17V2M7 2V4H4V7H2V3.5C2 3.11 2.16 2.76 2.46 2.46C2.76 2.16 3.11 2 3.5 2H7M10.5 6C13 6 15 8 15 10.5C15 11.38 14.75 12.2 14.31 12.9L17.57 16.16L16.16 17.57L12.9 14.31C12.2 14.75 11.38 15 10.5 15C8 15 6 13 6 10.5C6 8 8 6 10.5 6M10.5 8C9.12 8 8 9.12 8 10.5C8 11.88 9.12 13 10.5 13C11.88 13 13 11.88 13 10.5C13 9.12 11.88 8 10.5 8Z" /></svg>`;
  const ICON_GIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.6,10.59L8.38,4.8L10.07,6.5C9.83,7.35 10.22,8.28 11,8.73V14.27C10.4,14.61 10,15.26 10,16A2,2 0 0,0 12,18A2,2 0 0,0 14,16C14,15.26 13.6,14.61 13,14.27V9.41L15.07,11.5C15,11.65 15,11.82 15,12A2,2 0 0,0 17,14A2,2 0 0,0 19,12A2,2 0 0,0 17,10C16.82,10 16.65,10 16.5,10.07L13.93,7.5C14.19,6.57 13.71,5.55 12.78,5.16C12.35,5 11.9,4.96 11.5,5.07L9.8,3.38L10.59,2.6C11.37,1.81 12.63,1.81 13.41,2.6L21.4,10.59C22.19,11.37 22.19,12.63 21.4,13.41L13.41,21.4C12.63,22.19 11.37,22.19 10.59,21.4L2.6,13.41C1.81,12.63 1.81,11.37 2.6,10.59Z" /></svg>`;
  const ICON_PRESET = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M21.34 15.84L17.75 19.43L16.16 17.84L15 19L17.75 22L22.5 17.25L21.34 15.84Z" /></svg>`;
  const ICON_COLLAPSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4,2A2,2 0 0,0 2,4V14H4V4H14V2H4M8,6A2,2 0 0,0 6,8V18H8V8H18V6H8M20,12V20H12V12H20M20,10H12A2,2 0 0,0 10,12V20A2,2 0 0,0 12,22H20A2,2 0 0,0 22,20V12A2,2 0 0,0 20,10M19,17H13V15H19V17Z" /></svg>`;

  return `
  <div class="toolbar">
    <button id="scan" class="icon-btn" title="Scan Workspace">${ICON_SCAN}</button>
    <button id="scanGit" class="icon-btn" title="Scan Git Changes">${ICON_GIT}</button>
    <button id="preset" class="icon-btn" title="Apply Smart Preset">${ICON_PRESET}</button>
    <button id="toggleCollapse" class="icon-btn" title="Toggle Collapse/Expand All">
       <span id="collapseIcon">${ICON_COLLAPSE}</span>
    </button>
  </div>`;
}

function getSettingsSection(): string {
  const formatOptions = OUTPUT_FORMATS.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  const templateOptions = getTemplates().map(t => `<option value="${t.id}" title="${t.description}">${t.label}</option>`).join('');

  return `
  <select id="formatSelect" title="Output Format">${formatOptions}</select>
  <select id="templateSelect" title="Prompt Template">${templateOptions}</select>
  <div class="flex-row" style="display:flex; justify-content: space-between; margin-bottom: 8px;">
    <label><input type="checkbox" id="gitignore" /> .gitignore</label>
    <label><input type="checkbox" id="sensitive" /> Hide Secrets</label>
  </div>`;
}

function getTreeSection(): string {
  const ICON_TREE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22,11V3H15V6H9V3H2V11H9V8H11V18H15V21H22V13H15V16H13V8H15V11H22M4,9V5H7V9H4M17,9V5H20V9H17M17,19V15H20V19H17Z" /></svg>`;
  
  return `
  <input type="text" id="searchBox" placeholder="Filter files..." />
  <div id="tree"></div>
  <div class="primary-actions">
      <button id="copy" class="big-btn">Copy All</button>
      <button id="copyTree" class="big-btn secondary-btn" title="Copy Structure Only">${ICON_TREE} Tree</button>
      <button id="export" class="big-btn secondary-btn">Export</button>
  </div>`;
}

function getFooterSection(): string {
  return `
  <div class="sticky-footer">
      <span id="selectedCount">0 files</span>
      <span id="tokenCount" style="opacity: 0.8; font-weight: 600;">0 tokens</span>
  </div>`;
}

// JAVASCRIPT LOGIC

function getScripts(basePath: string): string {
  const fileMapJson = JSON.stringify(FILE_ICON_MAP);
  const exactFileMapJson = JSON.stringify(EXACT_FILE_MAP);
  
  const ICON_CHEVRON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.714v.619l-4.667 4.667-.619-.62 4.358-4.357z"/></svg>`;
  const ICON_COLLAPSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4,2A2,2 0 0,0 2,4V14H4V4H14V2H4M8,6A2,2 0 0,0 6,8V18H8V8H18V6H8M20,12V20H12V12H20M20,10H12A2,2 0 0,0 10,12V20A2,2 0 0,0 12,22H20A2,2 0 0,0 22,20V12A2,2 0 0,0 20,10M19,17H13V15H19V17Z" /></svg>`;
  const ICON_EXPAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4,2A2,2 0 0,0 2,4V14H4V4H14V2H4M8,6A2,2 0 0,0 6,8V18H8V8H18V6H8M20,12V20H12V12H20M20,10H12A2,2 0 0,0 10,12V20A2,2 0 0,0 12,22H20A2,2 0 0,0 20,10M19,17H17V19H15V17H13V15H15V13H17V15H19V17Z" /></svg>`;

  return `
  <script>
    const vscode = acquireVsCodeApi();
    const treeEl = document.getElementById('tree');
    
    const BASE_PATH = "${basePath}";
    const FILE_MAP = ${fileMapJson};
    const EXACT_MAP = ${exactFileMapJson};
    
    let isAllCollapsed = false;
    const COLLAPSE_ICON = '${ICON_COLLAPSE_SVG}';
    const EXPAND_ICON = '${ICON_EXPAND_SVG}';
    const CHEVRON_ICON = '${ICON_CHEVRON_SVG}';

    function getFileIconUrl(filename) {
        const lowerName = filename.toLowerCase();
        let iconName = 'default_file';
        if (EXACT_MAP[lowerName]) {
            iconName = EXACT_MAP[lowerName];
        } else {
            const parts = lowerName.split('.');
            if (parts.length > 1) {
                const ext = parts.pop();
                const ext2 = parts.length > 0 ? parts[parts.length-1] + '.' + ext : '';
                if (FILE_MAP[ext2]) iconName = FILE_MAP[ext2];
                else if (FILE_MAP[ext]) iconName = FILE_MAP[ext];
            }
        }
        return \`\${BASE_PATH}/\${iconName}.svg\`;
    }

    function renderNode(node, container) {
      if (!node) return;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'node-wrapper';

      const row = document.createElement('div');
      row.className = 'row';
      row.setAttribute('data-path', node.path);
      row.setAttribute('data-type', node.type);
      row.tabIndex = 0; 

      const twistie = document.createElement('div');
      twistie.className = 'twistie'; 

      if (node.type === 'directory') {
          twistie.innerHTML = CHEVRON_ICON;
          twistie.classList.add('expanded'); 

          row.toggleFolder = () => {
              const childrenContainer = wrapper.querySelector('.children-container');
              if (childrenContainer) {
                  const isClosed = childrenContainer.classList.contains('hidden');
                  if (isClosed) {
                      childrenContainer.classList.remove('hidden');
                      twistie.classList.add('expanded');
                  } else {
                      childrenContainer.classList.add('hidden');
                      twistie.classList.remove('expanded');
                  }
              }
          };

          const toggleFn = (e) => {
              e.stopPropagation();
              row.toggleFolder();
          };
          twistie.onclick = toggleFn;
          row.onclick = toggleFn; 
      } else {
          twistie.classList.add('hidden-arrow');
          row.onclick = (e) => {
             e.stopPropagation();
             vscode.postMessage({ command: 'open', path: node.path });
          };
      }
      row.appendChild(twistie);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = node.checked;
      checkbox.tabIndex = -1; 
      checkbox.onclick = (e) => e.stopPropagation(); 
      checkbox.onchange = () => {
          vscode.postMessage({ command: 'toggle', path: node.path, checked: checkbox.checked });
          updateStats();
      };
      row.appendChild(checkbox);

      if (node.type === 'file') {
          const iconImg = document.createElement('img');
          iconImg.className = 'icon-img';
          iconImg.src = getFileIconUrl(node.name);
          row.appendChild(iconImg);
      }

      const label = document.createElement('span');
      label.className = 'node-label';
      label.textContent = node.name;
      
      if (node.type === 'file') {
          label.classList.add('file-link');
          label.title = "Preview File";
      } else {
          label.style.fontWeight = '600'; 
      }
      row.appendChild(label);

      wrapper.appendChild(row);

      if (node.children && node.children.length > 0) {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'children-container'; 
          node.children.forEach(child => renderNode(child, childrenContainer));
          wrapper.appendChild(childrenContainer);
      }
      container.appendChild(wrapper);
    }

    function updateStats() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        let fileCount = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const row = cb.closest('.row'); 
                if (row && row.querySelector('.twistie.hidden-arrow')) fileCount++;
            }
        });
        document.getElementById('selectedCount').textContent = fileCount + ' files';
        const estTokens = fileCount * 400; 
        const tokenText = estTokens > 1000 ? (estTokens/1000).toFixed(1) + 'k' : estTokens;
        document.getElementById('tokenCount').textContent = '~' + tokenText + ' tokens';
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^$\{}()|[\\]\\\\]/g, '\\\\$&'); 
    }

    document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (!active || !active.classList.contains('row')) return;

        const allRows = Array.from(document.querySelectorAll('.row'));
        const visibleRows = allRows.filter(row => row.offsetParent !== null);
        const idx = visibleRows.indexOf(active);

        if (idx === -1) return;

        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                const next = visibleRows[idx + 1];
                if (next) next.focus();
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                const prev = visibleRows[idx - 1];
                if (prev) prev.focus();
                break;
            }
            case 'ArrowRight': {
                e.preventDefault();
                const type = active.getAttribute('data-type');
                const twistie = active.querySelector('.twistie');
                const isExpanded = twistie && twistie.classList.contains('expanded');
                
                if (type === 'directory') {
                    if (!isExpanded) {
                        active.toggleFolder();
                    } else {
                        const next = visibleRows[idx + 1];
                        if (next) next.focus();
                    }
                }
                break;
            }
            case 'ArrowLeft': {
                e.preventDefault();
                const type = active.getAttribute('data-type');
                const twistie = active.querySelector('.twistie');
                const isExpanded = twistie && twistie.classList.contains('expanded');
                
                if (type === 'directory' && isExpanded) {
                    active.toggleFolder();
                } else {
                    const wrapper = active.parentElement;
                    const container = wrapper.parentElement;
                    if (container && container.classList.contains('children-container')) {
                        const parentWrapper = container.parentElement;
                        const parentRow = parentWrapper.querySelector('.row');
                        if (parentRow) parentRow.focus();
                    }
                }
                break;
            }
            case ' ': {
                e.preventDefault();
                const checkbox = active.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                checkbox.onchange();
                break;
            }
            case 'Enter': {
                e.preventDefault();
                active.click();
                break;
            }
        }
    });

    document.getElementById('searchBox').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const allWrappers = document.querySelectorAll('.node-wrapper');
        const rows = document.querySelectorAll('.row');

        if (!term) { 
            allWrappers.forEach(w => w.style.display = 'block');
            rows.forEach(row => {
                const label = row.querySelector('.node-label');
                if (label) label.innerHTML = label.textContent; 
            });
            return; 
        }
        
        allWrappers.forEach(w => w.style.display = 'none');
        const visiblePaths = new Set();
        
        rows.forEach(row => {
            const label = row.querySelector('.node-label');
            const originalText = label.textContent; 
            const lowerText = originalText.toLowerCase();
            const fullPath = row.getAttribute('data-path'); 
            
            label.innerHTML = originalText;

            if (lowerText.includes(term)) {
                if (fullPath) {
                    visiblePaths.add(fullPath);
                    let current = fullPath;
                    while (true) {
                        const lastSlash = Math.max(current.lastIndexOf('/'), current.lastIndexOf('\\\\'));
                        if (lastSlash < 0) break;
                        current = current.substring(0, lastSlash);
                        if (current) visiblePaths.add(current);
                    }
                }
                
                const safeTerm = escapeRegExp(term);
                const regex = new RegExp(\`(\${safeTerm})\`, 'gi');
                label.innerHTML = originalText.replace(regex, '<span class="highlight">$1</span>');
            }
        });
        
        rows.forEach(row => {
            const path = row.getAttribute('data-path');
            if (visiblePaths.has(path)) {
                row.parentElement.style.display = 'block';
                const parentContainer = row.parentElement.parentElement;
                if (parentContainer.classList.contains('children-container')) parentContainer.classList.remove('hidden');
            }
        });
    });

    document.getElementById('toggleCollapse').onclick = () => {
        const containers = document.querySelectorAll('.children-container');
        const twisties = document.querySelectorAll('.twistie:not(.hidden-arrow)');
        const btnIcon = document.getElementById('collapseIcon');

        if (!isAllCollapsed) {
            containers.forEach(c => c.classList.add('hidden')); 
            twisties.forEach(t => t.classList.remove('expanded'));
            btnIcon.innerHTML = EXPAND_ICON;
            isAllCollapsed = true;
        } else {
            containers.forEach(c => c.classList.remove('hidden'));
            twisties.forEach(t => t.classList.add('expanded'));
            btnIcon.innerHTML = COLLAPSE_ICON;
            isAllCollapsed = false;
        }
    };

    window.addEventListener('message', event => {
      const { command, payload } = event.data;
      if (command === 'uiState') {
        document.getElementById('gitignore').checked = payload.useGitIgnore;
        document.getElementById('sensitive').checked = payload.excludeSensitive;
        
        // CHANGED: Update formatSelect value from state
        if(payload.selectedFormat) document.getElementById('formatSelect').value = payload.selectedFormat;
        if(payload.selectedTemplate) document.getElementById('templateSelect').value = payload.selectedTemplate;
      }
      if (command === 'tree') {
        treeEl.innerHTML = '';
        renderNode(payload, treeEl);
        document.getElementById('searchBox').value = '';
        setTimeout(updateStats, 100); 
        isAllCollapsed = false;
        document.getElementById('collapseIcon').innerHTML = COLLAPSE_ICON;
      }
    });

    // CHANGED: Listener for format change
    document.getElementById('formatSelect').onchange = (e) => vscode.postMessage({ command: 'changeFormat', value: e.target.value });
    document.getElementById('templateSelect').onchange = (e) => vscode.postMessage({ command: 'changeTemplate', value: e.target.value });
    document.getElementById('scan').onclick = () => vscode.postMessage({ command: 'scan' });
    document.getElementById('scanGit').onclick = () => vscode.postMessage({ command: 'scanGit' });
    document.getElementById('preset').onclick = () => vscode.postMessage({ command: 'preset' });
    document.getElementById('copy').onclick = () => vscode.postMessage({ command: 'copy' });
    document.getElementById('copyTree').onclick = () => vscode.postMessage({ command: 'copyTree' });
    document.getElementById('export').onclick = () => vscode.postMessage({ command: 'export' });
    document.getElementById('gitignore').onchange = e => vscode.postMessage({ command: 'toggleGitIgnore', value: e.target.checked });
    document.getElementById('sensitive').onchange = e => vscode.postMessage({ command: 'toggleSensitive', value: e.target.checked });

    vscode.postMessage({ command: 'webviewReady' });
  </script>
  `;
}