// src/sidebar/view/htmlRenderer.ts
import { Uri } from 'vscode';
import { getStyles } from './styles';
import { getToolbar, getSettingsSection, getTreeSection, getActionsSection, getFooterSection } from './components';
import { getScripts } from './scripts';

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
  ${getActionsSection()} 
  ${getFooterSection()} 
  ${getScripts(basePath)}
</body>
</html>
  `;
}