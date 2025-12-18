// src/core/snapshotBuilder.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectNode } from '../types';
import { mapLanguage } from '../utils/languageMapper';
import { readTextFile } from '../utils/fs';

/**
 * Builds a single AI-ready snapshot from selected project nodes.
 *
 * @param root - Root project node
 * @returns Snapshot text
 */
export async function buildSnapshot(
  root: ProjectNode
): Promise<string> {
  const files: ProjectNode[] = [];
  collectCheckedFiles(root, files);

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
