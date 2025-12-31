// src/core/fileScanner.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { IgnoreResolver } from './ignoreResolver';
import { ProjectNode } from '../types';

/**
 * Maximum allowed file size in bytes (1 MB).
 * Files exceeding this limit will be tagged with metadata and their content may be skipped.
 */
const MAX_FILE_SIZE = 1 * 1024 * 1024;

/**
 * A set of common binary file extensions.
 * These files are identified by extension to prevent attempting to read binary content as text.
 */
const BINARY_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.iso'
]);

/**
 * Represents the outcome of a workspace scan operation.
 */
export type ScanResult = {
    /** The root node of the constructed project tree, or null if the workspace is empty or invalid. */
    root: ProjectNode | null;
};

/**
 * Configuration options for the workspace scanning process.
 */
type ScanOptions = {
    /** Whether to parse and respect .gitignore rules. Defaults to true. */
    useGitIgnore?: boolean;
    /** Whether to exclude common sensitive files (e.g., .env, ID keys). Defaults to true. */
    excludeSensitive?: boolean;
    /** A specific absolute path to scan. If omitted, scans the first workspace folder. */
    targetPath?: string;
};

/**
 * Initiates a scan of the current VS Code workspace or a specified target path.
 * * This function resolves the root directory, configures the ignore rules, and triggers
 * the recursive directory scanning process.
 * * @param options - Configuration options for the scan behavior.
 * @returns A promise resolving to the {@link ScanResult} containing the project tree.
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
        return { root: null };
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
    
    const rootNode = await scanDirectory(targetPath, ignore);

    return { root: rootNode };
}

/**
 * Recursively scans a directory to build a {@link ProjectNode} tree structure.
 * * This function handles:
 * - Filtering files based on the {@link IgnoreResolver}.
 * - Recursively traversing subdirectories.
 * - Identifying file metadata (Size, Binary status).
 * * @param dirPath - The absolute path of the directory to scan.
 * @param ignore - The resolver instance used to check if paths should be excluded.
 * @returns A promise resolving to a {@link ProjectNode} for the directory, or null if empty/ignored.
 */
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

        if (name !== '.gitignore' && ignore.shouldIgnore(fullPath)) {
            continue;
        }

        if (type === vscode.FileType.Directory) {
            const childDir = await scanDirectory(fullPath, ignore);
            if (childDir && childDir.children?.length) {
                children.push(childDir);
            }
        } else {
            try {
                const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                const ext = path.extname(name).toLowerCase();
                
                let meta: string | undefined = undefined;

                if (stat.size > MAX_FILE_SIZE) {
                    meta = 'Large (>1MB)';
                } 
                else if (BINARY_EXTENSIONS.has(ext)) {
                    meta = 'Binary';
                }

                children.push({
                    path: fullPath,
                    name,
                    type: 'file',
                    checked: true, 
                    meta: meta
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