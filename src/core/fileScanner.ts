// src/core/fileScanner.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { IgnoreResolver } from './ignoreResolver';
import { ProjectNode } from '../types';

type ScanOptions = {
  useGitIgnore?: boolean;
  excludeSensitive?: boolean;
};

/**
 * Scans the workspace and builds a project tree.
 * Safe against missing options and ignored directories.
 */
export async function scanWorkspace(
  options?: ScanOptions
): Promise<ProjectNode | null> {
  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) {
    return null;
  }

  const {
    useGitIgnore = true,
    excludeSensitive = true
  } = options ?? {};

  const ignore = new IgnoreResolver({
    rootPath: root.uri.fsPath,
    useGitIgnore,
    excludeSensitive
  });

  return scanDirectory(root.uri.fsPath, ignore);
}

async function scanDirectory(
  dirPath: string,
  ignore: IgnoreResolver
): Promise<ProjectNode | null> {
  const entries = await vscode.workspace.fs.readDirectory(
    vscode.Uri.file(dirPath)
  );

  const children: ProjectNode[] = [];

  for (const [name, type] of entries) {
    const fullPath = path.join(dirPath, name);

    // Always show .gitignore
    if (name !== '.gitignore' && ignore.shouldIgnore(fullPath)) {
      continue;
    }

    if (type === vscode.FileType.Directory) {
      const childDir = await scanDirectory(fullPath, ignore);
      if (childDir && childDir.children?.length) {
        children.push(childDir);
      }
    } else {
      children.push({
        path: fullPath,
        name,
        type: 'file',
        checked: true
      });
    }
  }

  // Do not return empty directories
  if (children.length === 0) {
    return null;
  }

  return {
    path: dirPath,
    name: path.basename(dirPath),
    type: 'directory',
    checked: true,
    children
  };
}
