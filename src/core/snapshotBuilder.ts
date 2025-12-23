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
 * Generates a consolidated snapshot of the selected project files.
 */
export async function buildSnapshot(
  root: ProjectNode,
  format: SnapshotFormat = 'markdown'
): Promise<string> {
  const files: ProjectNode[] = [];
  collectCheckedFiles(root, files);

  if (format === 'xml') {
    let output = '<documents>\n';
    
    // Reuse the path tree logic for the structure document
    const structure = buildPathTree(root);
    
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

  // Markdown format
  const structure = buildPathTree(root);
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
 * Generates a flat list of relative file paths.
 */
export function buildPathTree(root: ProjectNode): string {
    const files: ProjectNode[] = [];
    collectCheckedFiles(root, files);
    return files.map(f => path.relative(root.path, f.path).replace(/\\/g, '/')).join('\n');
}

/**
 * Generates a visual ASCII tree structure (e.g., ├── src/).
 */
export function buildAsciiTree(root: ProjectNode): string {
    let output = `${root.name}/\n`;
    
    // Helper to recursively build tree
    const traverse = (node: ProjectNode, prefix: string, isLast: boolean) => {
        if (!node.children) {return;}

        // Filter only checked children or directories that contain checked children
        const visibleChildren = node.children.filter(child => {
            if (child.type === 'file') {return child.checked;}
            return hasCheckedDescendant(child);
        });

        visibleChildren.forEach((child, index) => {
            const isChildLast = index === visibleChildren.length - 1;
            const connector = isChildLast ? '└── ' : '├── ';
            
            output += `${prefix}${connector}${child.name}${child.type === 'directory' ? '/' : ''}\n`;
            
            if (child.type === 'directory') {
                const childPrefix = prefix + (isChildLast ? '    ' : '│   ');
                traverse(child, childPrefix, isChildLast);
            }
        });
    };

    traverse(root, '', true);
    return output;
}

// --- Helpers ---

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

function hasCheckedDescendant(node: ProjectNode): boolean {
    if (node.type === 'file') {return node.checked;}
    return node.children?.some(child => hasCheckedDescendant(child)) ?? false;
}