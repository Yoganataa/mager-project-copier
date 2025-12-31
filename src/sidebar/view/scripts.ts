// src/sidebar/view/scripts.ts
import { FILE_ICON_MAP, EXACT_FILE_MAP } from './iconMap';

export function getScripts(basePath: string): string {
  const fileMapJson = JSON.stringify(FILE_ICON_MAP);
  const exactFileMapJson = JSON.stringify(EXACT_FILE_MAP);
  
  const ICON_CHEVRON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.714v.619l-4.667 4.667-.619-.62 4.358-4.357z"/></svg>`;
  const ICON_COLLAPSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4,2A2,2 0 0,0 2,4V14H4V4H14V2H4M8,6A2,2 0 0,0 6,8V18H8V8H18V6H8M20,12V20H12V12H20M20,10H12A2,2 0 0,0 10,12V20A2,2 0 0,0 12,22H20A2,2 0 0,0 20,10M19,17H13V15H19V17Z" /></svg>`;
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

    function setLoading(isLoading) {
        const btns = document.querySelectorAll('.big-btn, .icon-btn');
        btns.forEach(btn => btn.disabled = isLoading);
        
        const copyBtn = document.getElementById('copy');
        if (isLoading) {
            copyBtn.dataset.oldText = copyBtn.innerText;
            copyBtn.innerText = 'Copying...';
        } else {
            if (copyBtn.dataset.oldText) copyBtn.innerText = copyBtn.dataset.oldText;
        }
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
          const isChecked = checkbox.checked;
          vscode.postMessage({ command: 'toggle', path: node.path, checked: isChecked });
          
          if (node.type === 'directory') {
             const childrenContainer = wrapper.querySelector('.children-container');
             if (childrenContainer) {
                 const childCheckboxes = childrenContainer.querySelectorAll('input[type="checkbox"]');
                 childCheckboxes.forEach(cb => cb.checked = isChecked);
             }
          }
          
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
          
          if (node.meta) {
              const metaSpan = document.createElement('span');
              metaSpan.className = 'meta-label';
              metaSpan.textContent = node.meta;
              label.appendChild(metaSpan);
          }
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

    // --- DEBOUNCED SEARCH LISTENER ---
    let searchTimeout;
    document.getElementById('searchBox').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const allWrappers = document.querySelectorAll('.node-wrapper');
            const rows = document.querySelectorAll('.row');

            if (!term) { 
                allWrappers.forEach(w => w.style.display = 'block');
                rows.forEach(row => {
                    const label = row.querySelector('.node-label');
                    if(label.firstChild) label.firstChild.textContent = label.firstChild.textContent;
                });
                return; 
            }
            
            allWrappers.forEach(w => w.style.display = 'none');
            const visiblePaths = new Set();
            
            rows.forEach(row => {
                const label = row.querySelector('.node-label');
                const originalText = label.firstChild.textContent; // Text node only
                const lowerText = originalText.toLowerCase();
                const fullPath = row.getAttribute('data-path'); 
                
                label.firstChild.textContent = originalText;

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
                    
                    const newHtml = originalText.replace(regex, '<span class="highlight">$1</span>');
                    
                    if (label.querySelector('.meta-label')) {
                        label.innerHTML = newHtml + label.querySelector('.meta-label').outerHTML;
                    } else {
                        label.innerHTML = newHtml;
                    }
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
        }, 300); // 300ms Delay
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

    document.getElementById('resetSelection').onclick = () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        updateStats();
        vscode.postMessage({ command: 'uncheckAll' });
    };

    window.addEventListener('message', event => {
      const { command, payload } = event.data;
      if (command === 'uiState') {
        document.getElementById('gitignore').checked = payload.useGitIgnore;
        document.getElementById('sensitive').checked = payload.excludeSensitive;
        
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
      if (command === 'actionComplete') {
          setLoading(false);
      }
    });

    document.getElementById('formatSelect').onchange = (e) => vscode.postMessage({ command: 'changeFormat', value: e.target.value });
    document.getElementById('templateSelect').onchange = (e) => vscode.postMessage({ command: 'changeTemplate', value: e.target.value });
    
    document.getElementById('scan').onclick = () => { setLoading(true); vscode.postMessage({ command: 'scan' }); };
    document.getElementById('scanGit').onclick = () => { setLoading(true); vscode.postMessage({ command: 'scanGit' }); };
    document.getElementById('preset').onclick = () => vscode.postMessage({ command: 'preset' });
    document.getElementById('copy').onclick = () => { setLoading(true); vscode.postMessage({ command: 'copy' }); };
    document.getElementById('copyTree').onclick = () => { setLoading(true); vscode.postMessage({ command: 'copyTree' }); };
    document.getElementById('export').onclick = () => { setLoading(true); vscode.postMessage({ command: 'export' }); };
    
    document.getElementById('gitignore').onchange = e => vscode.postMessage({ command: 'toggleGitIgnore', value: e.target.checked });
    document.getElementById('sensitive').onchange = e => vscode.postMessage({ command: 'toggleSensitive', value: e.target.checked });

    vscode.postMessage({ command: 'webviewReady' });
  </script>
  `;
}