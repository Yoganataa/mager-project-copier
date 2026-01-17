// src/sidebar/view/htmlRenderer.ts
import { Uri } from 'vscode';
import { getStyles } from './styles';
import { getToolbar, getSettingsSection, getSearchSection, getTreeSection, getActionsSection, getFooterSection, getPresetsSection } from './components';
import { getScripts } from './scripts';

export function getWebviewContent(iconBaseUri: Uri): string {
  const basePath = iconBaseUri.toString(); 
  
  const cspSource = iconBaseUri.scheme === 'vscode-resource' 
    ? 'vscode-resource:' 
    : 'https:';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  
  <meta http-equiv="Content-Security-Policy" content="
      default-src 'none';
      img-src ${cspSource} https: data:;
      script-src 'unsafe-inline' ${cspSource};
      style-src 'unsafe-inline' ${cspSource};
      font-src ${cspSource};
  ">
  
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${getStyles()}
</head>
<body>
  <div class="fixed-header">
      ${getToolbar()}
      ${getSettingsSection()}
      ${getSearchSection()}
      ${getPresetsSection()}
  </div>

  <div class="scroll-content">
      ${getTreeSection()} 
  </div>

  ${getActionsSection()} 
  ${getFooterSection()} 
  ${getScripts(basePath)}
</body>
</html>
`;
}
