// src/core/fileScanner.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { IgnoreResolver } from './ignoreResolver';
import { ProjectNode } from '../types';

/**
 * Maximum allowed file size in bytes (1 MB).
 * Files larger than this threshold will be excluded from the scan.
 */
const MAX_FILE_SIZE = 1 * 1024 * 1024;

/**
 * Represents the result of a workspace scan operation.
 */
export type ScanResult = {
  /** The root node of the scanned directory tree, or null if no valid files were found. */
  root: ProjectNode | null;
  /** A list of filenames that were skipped during the scan (e.g., due to size limits). */
  skippedFiles: string[];
};

/**
 * Configuration options for the file scanning process.
 */
type ScanOptions = {
  /** Whether to respect .gitignore rules. Defaults to true. */
  useGitIgnore?: boolean;
  /** Whether to exclude common sensitive files and directories (e.g., .env, node_modules). Defaults to true. */
  excludeSensitive?: boolean;
  /** The specific path to scan. If not provided, the scan defaults to the workspace root. */
  targetPath?: string;
};

/**
 * Scans the VS Code workspace or a specific target directory to build a project file tree.
 * * This function initializes the ignore resolver based on the workspace root and recursively
 * traverses the directory structure using the provided options.
 *
 * @param options - Optional configuration settings for the scan.
 * @returns A promise that resolves to the {@link ScanResult} containing the file tree and skipped files.
 */
export async function scanWorkspace(
  options?: ScanOptions
): Promise<ScanResult> {
  let workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (options?.targetPath) {
    const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(options.targetPath));
    if (folder) {
      workspaceRoot = folder.uri.fsPath;
    }
  }

  if (!workspaceRoot) {
    return { root: null, skippedFiles: [] };
  }

  const { 
    useGitIgnore = true, 
    excludeSensitive = true,
    targetPath = workspaceRoot 
  } = options ?? {};

  const ignore = new IgnoreResolver({
    rootPath: workspaceRoot, 
    useGitIgnore,
    excludeSensitive
  });

  const skippedFiles: string[] = [];
  
  const rootNode = await scanDirectory(targetPath, ignore, skippedFiles);

  return { 
    root: rootNode, 
    skippedFiles 
  };
}

/**
 * Recursively scans a directory and its subdirectories to build a project node structure.
 * * @param dirPath - The absolute path of the directory to scan.
 * @param ignore - The resolver instance used to determine if a file or directory should be ignored.
 * @param skippedFiles - An array to accumulate the names of files skipped due to size limits.
 * @returns A promise that resolves to a {@link ProjectNode} representing the directory, or null if empty.
 */
async function scanDirectory(
  dirPath: string,
  ignore: IgnoreResolver,
  skippedFiles: string[]
): Promise<ProjectNode | null> {
  const entries = await vscode.workspace.fs.readDirectory(
    vscode.Uri.file(dirPath)
  );

  const children: ProjectNode[] = [];

  for (const [name, type] of entries) {
    const fullPath = path.join(dirPath, name);

    if (name !== '.gitignore' && ignore.shouldIgnore(fullPath)) {
      continue;
    }

    if (type === vscode.FileType.Directory) {
      const childDir = await scanDirectory(fullPath, ignore, skippedFiles);
      if (childDir && childDir.children?.length) {
        children.push(childDir);
      }
    } else {
      try {
        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
        
        if (stat.size > MAX_FILE_SIZE) {
          skippedFiles.push(name);
          continue;
        }

        children.push({
          path: fullPath,
          name,
          type: 'file',
          checked: true 
        });
      } catch {
        continue;
      }
    }
  }

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