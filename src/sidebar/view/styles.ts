// src/sidebar/view/styles.ts

export function getStyles(): string {
  return `
  <style>
    :root { --indent-guide-color: var(--vscode-tree-indentGuidesStroke); }
    
    /* PENTING: Padding bottom diperbesar (95px) agar konten scroll tidak tertutup tombol fixed */
    body { 
        font-family: var(--vscode-font-family); 
        padding: 10px; 
        padding-bottom: 95px; 
        color: var(--vscode-foreground); 
        font-size: 13px; 
    }
    
    .hidden { display: none !important; }

    /* Highlight Class for Search Results */
    .highlight { 
        background-color: var(--vscode-editor-findMatchHighlightBackground); 
        color: inherit;
        border-radius: 2px;
    }
    
    /* Meta Label (e.g. "Binary") */
    .meta-label {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-left: 8px;
        opacity: 0.8;
        border: 1px solid var(--vscode-widget-border);
        padding: 0 4px;
        border-radius: 3px;
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
    
    /* Fixed Action Buttons */
    .primary-actions { 
        display: grid; 
        grid-template-columns: 2fr 1fr 1fr; 
        gap: 6px; 
        
        position: fixed;
        bottom: 30px; /* Tepat di atas footer */
        left: 0; 
        right: 0;
        padding: 10px 15px;
        background: var(--vscode-sideBar-background);
        border-top: 1px solid var(--vscode-widget-border);
        z-index: 998; 
    }

    .big-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 6px; border: none; border-radius: 2px; cursor: pointer; font-size: 12px; height: 30px; transition: opacity 0.2s; }
    .big-btn:hover { background: var(--vscode-button-hoverBackground); }
    
    /* Disabled state for buttons */
    .big-btn:disabled, .icon-btn:disabled { opacity: 0.5; cursor: wait; pointer-events: none; }

    .secondary-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .secondary-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }

    /* Tree View */
    #tree { margin-top: 10px; padding-left: 0; }
    .node-wrapper { display: block; }
    
    /* Row Styles */
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

    /* Sticky Footer */
    .sticky-footer { 
        position: fixed; 
        bottom: 0; 
        left: 0; 
        right: 0; 
        height: 30px; 
        background: var(--vscode-sideBar-background); 
        border-top: 1px solid var(--vscode-widget-border); 
        padding: 0 15px; 
        font-size: 11px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        z-index: 999; 
    }
    
    #resetSelection { opacity: 0.7; transition: opacity 0.2s; }
    #resetSelection:hover { opacity: 1; background-color: rgba(255, 0, 0, 0.1); border-radius: 4px; }
  </style>
  `;
}