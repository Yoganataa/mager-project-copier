// src/core/snapshotBuilder.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectNode } from '../types';
import { mapLanguage } from '../utils/languageMapper';
import { readTextFile } from '../utils/fs';

/**
 * Supported output formats for the snapshot generation.
 */
export type SnapshotFormat = 'markdown' | 'xml';

/**
 * Generates a consolidated snapshot of the selected project files, formatted for AI consumption.
 * * This function supports two major output formats:
 * - **Markdown:** Standard format suitable for GPT and Gemini models.
 * - **XML:** Structured format optimized for Claude.
 *
 * @param root - The root node of the project tree.
 * @param format - The desired output format ('markdown' or 'xml'). Defaults to 'markdown'.
 * @returns A promise that resolves to the generated snapshot string.
 */
export async function buildSnapshot(
  root: ProjectNode,
  format: SnapshotFormat = 'markdown'
): Promise<string> {
  const files: ProjectNode[] = [];
  collectCheckedFiles(root, files);

  if (format === 'xml') {
    let output = '<documents>\n';
    
    const structure = files
      .map(f => path.relative(root.path, f.path))
      .join('\n');
    
    output += `  <document index="1">\n`;
    output += `    <source>project_structure.txt</source>\n`;
    output += `    <document_content>\n${structure}\n    </document_content>\n`;
    output += `  </document>\n`;

    let index = 2;
    for (const file of files) {
        const uri = vscode.Uri.file(file.path);
        const content = await readTextFile(uri);
        if (content === null) {continue;}

        const relative = path.relative(root.path, file.path);
        
        output += `  <document index="${index}">\n`;
        output += `    <source>${relative}</source>\n`;
        output += `    <document_content>\n${content}\n    </document_content>\n`;
        output += `  </document>\n`;
        index++;
    }
    output += '</documents>';
    return output;
  }

  const structure = files
    .map(f => path.relative(root.path, f.path))
    .join('\n');

  let output = `# Project Structure\n${structure}\n\n---\n`;

  for (const file of files) {
    const uri = vscode.Uri.file(file.path);
    const content = await readTextFile(uri);
    if (content === null) {continue;}

    const relative = path.relative(root.path, file.path);
    const lang = mapLanguage(file.name);

    output += `\n## ${relative}\n`;
    output += `\`\`\`${lang}\n${content}\n\`\`\`\n`;
  }

  return output;
}

/**
 * Recursively collects all checked files from the project tree.
 * * @param node - The current project node being traversed.
 * @param acc - The accumulator array where selected file nodes are stored.
 */
function collectCheckedFiles(
  node: ProjectNode,
  acc: ProjectNode[]
): void {
  if (node.type === 'file' && node.checked) {
    acc.push(node);
  }

  node.children?.forEach(child =>
    collectCheckedFiles(child, acc)
  );
}