// src/sidebar/view/components.ts
import { OUTPUT_FORMATS } from '../../data/constants';
import { getTemplates } from '../../core/templateManager';

export function getToolbar(): string {
  const ICON_SCAN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 22V20H20V17H22V20.5C22 20.89 21.84 21.24 21.54 21.54C21.24 21.84 20.89 22 20.5 22H17M7 22H3.5C3.11 22 2.76 21.84 2.46 21.54C2.16 21.24 2 20.89 2 20.5V17H4V20H7V22M17 2H20.5C20.89 2 21.24 2.16 21.54 2.46C21.84 2.76 22 3.11 22 3.5V7H20V4H17V2M7 2V4H4V7H2V3.5C2 3.11 2.16 2.76 2.46 2.46C2.76 2.16 3.11 2 3.5 2H7M10.5 6C13 6 15 8 15 10.5C15 11.38 14.75 12.2 14.31 12.9L17.57 16.16L16.16 17.57L12.9 14.31C12.2 14.75 11.38 15 10.5 15C8 15 6 13 6 10.5C6 8 8 6 10.5 6M10.5 8C9.12 8 8 9.12 8 10.5C8 11.88 9.12 13 10.5 13C11.88 13 13 11.88 13 10.5C13 9.12 11.88 8 10.5 8Z" /></svg>`;
  const ICON_GIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.6,10.59L8.38,4.8L10.07,6.5C9.83,7.35 10.22,8.28 11,8.73V14.27C10.4,14.61 10,15.26 10,16A2,2 0 0,0 12,18A2,2 0 0,0 14,16C14,15.26 13.6,14.61 13,14.27V9.41L15.07,11.5C15,11.65 15,11.82 15,12A2,2 0 0,0 17,14A2,2 0 0,0 19,12A2,2 0 0,0 17,10C16.82,10 16.65,10 16.5,10.07L13.93,7.5C14.19,6.57 13.71,5.55 12.78,5.16C12.35,5 11.9,4.96 11.5,5.07L9.8,3.38L10.59,2.6C11.37,1.81 12.63,1.81 13.41,2.6L21.4,10.59C22.19,11.37 22.19,12.63 21.4,13.41L13.41,21.4C12.63,22.19 11.37,22.19 10.59,21.4L2.6,13.41C1.81,12.63 1.81,11.37 2.6,10.59Z" /></svg>`;
  const ICON_PRESET = `<svg viewBox="0 0 24 24"><path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z"/></svg>`;
  const ICON_RESOLVE_IMPORTS = `<svg viewBox="0 0 24 24"><path d="M13.5,2H19A2,2 0 0,1 21,4V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H10.5L13.5,2M13.5,4L10.5,7H5V20H19V4H13.5M7,9H17V11H7V9M7,13H17V15H7V13M7,17H14V19H7V17Z" /></svg>`;
  const ICON_COLLAPSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4,2A2,2 0 0,0 2,4V14H4V4H14V2H4M8,6A2,2 0 0,0 6,8V18H8V8H18V6H8M20,12V20H12V12H20M20,10H12A2,2 0 0,0 10,12V20A2,2 0 0,0 12,22H20A2,2 0 0,0 20,10M19,17H13V15H19V17Z" /></svg>`;

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

export function getSettingsSection(): string {
  const formatOptions = OUTPUT_FORMATS.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  const templateOptions = getTemplates().map(t => `<option value="${t.id}" title="${t.description}">${t.label}</option>`).join('');

  return `
  <select id="formatSelect" title="Output Format">${formatOptions}</select>
  <select id="templateSelect" title="Prompt Template">${templateOptions}</select>
  <div class="flex-row" style="display:flex; justify-content: space-between; margin-bottom: 8px;">
    <label><input type="checkbox" id="gitignore" /> .gitignore</label>
    <label title="Append active errors/warnings to code"><input type="checkbox" id="problems" /> Problems</label>
  </div>`;
}

export function getSearchSection(): string {
  return `<div class="search-wrapper">
    <input type="text" id="searchBox" placeholder="Filter files..." />
  </div>`;
}

export function getTreeSection(): string {
  return `<div id="tree"></div>`;
}

export function getActionsSection(): string {
  const ICON_TREE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22,11V3H15V6H9V3H2V11H9V8H11V18H15V21H22V13H15V16H13V8H15V11H22M4,9V5H7V9H4M17,9V5H20V9H17M17,19V15H20V19H17Z" /></svg>`;
  return `
    <div class="primary-actions">
      <button id="copy" class="big-btn">Copy All</button>
      <button id="copyTree" class="big-btn secondary-btn" title="Copy Structure Only">${ICON_TREE} Tree</button>
      <button id="export" class="big-btn secondary-btn">Export</button>
    </div>
    `;
}

export function getFooterSection(): string {
  const ICON_RESET = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19,8L15,12H18A6,6 0 0,1 12,18C11,18 10.03,17.75 9.2,17.3L7.74,18.76C8.97,19.54 10.43,20 12,20A8,8 0 0,0 20,12H23L19,8M6,12C6,8.69 8.69,6 12,6C12.97,6 13.88,6.25 14.69,6.7L16.15,5.24C14.92,4.46 13.46,4 12,4A8,8 0 0,0 4,12H1L5,16L9,12H6Z" /></svg>`;

  return `
  <div class="sticky-footer">
      <div style="display:flex; align-items:center; gap:8px;">
        <span id="selectedCount">0 files</span>
        <button id="resetSelection" title="Uncheck All" style="background:none; border:none; color:var(--vscode-errorForeground); cursor:pointer; padding:2px; display:flex; align-items:center;">
            ${ICON_RESET}
        </button>
      </div>
      <span id="tokenCount" style="opacity: 0.8; font-weight: 600;">0 tokens</span>
  </div>`;
}

export function getPresetsSection(): string {
  return `
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--vscode-widget-border);">
        <label style="font-weight:600; margin-bottom: 6px; display: block;">Saved Selections</label>
        <div style="display: flex; gap: 4px;">
            <select id="presetSelect" style="flex: 1;">
                <option value="" disabled selected>Select a preset...</option>
            </select>
            <button id="loadPreset" class="icon-btn" title="Load Preset">
                <svg viewBox="0 0 24 24"><path d="M19,9H15V3H9V9H5L12,16L19,9M5,18V20H19V18H5Z" /></svg>
            </button>
            <button id="savePreset" class="icon-btn" title="Save Current Selection">
                <svg viewBox="0 0 24 24"><path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" /></svg>
            </button>
            <button id="deletePreset" class="icon-btn" title="Delete Preset" style="color: var(--vscode-errorForeground);">
                <svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
            </button>
        </div>
    </div>
  `;
}