// src/core/snapshotBuilder.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectNode } from '../types';
import { mapLanguage } from '../utils/languageMapper';
import { readTextFile } from '../utils/fs';

/**
 * Defines the supported output formats for the snapshot generation.
 */
export type SnapshotFormat = 'markdown' | 'xml';

/**
 * Generates a consolidated snapshot of the selected project files in the specified format.
 * * This function aggregates file contents, creates a structural overview, and handles
 * metadata skipping (e.g., for binary or large files).
 * * @param root - The root node of the project tree containing the file selection state.
 * @param format - The desired output format ('markdown' or 'xml'). Defaults to 'markdown'.
 * @returns A promise resolving to the generated snapshot string.
 */
export async function buildSnapshot(
    root: ProjectNode,
    format: SnapshotFormat = 'markdown'
): Promise<string> {
    const files: ProjectNode[] = [];
    collectCheckedFiles(root, files);

    if (format === 'xml') {
        let output = '<documents>\n';
        
        const structure = buildPathTree(root);
        
        output += `  <document index="1">\n`;
        output += `    <source>project_structure.txt</source>\n`;
        output += `    <document_content>\n${structure}\n    </document_content>\n`;
        output += `  </document>\n`;

        let index = 2;
        for (const file of files) {
            const relative = path.relative(root.path, file.path);
            
            output += `  <document index="${index}">\n`;
            output += `    <source>${relative}</source>\n`;
            output += `    <document_content>\n`;
            
            if (file.meta) {
                 output += `[Skipped: ${file.meta}]\n`;
            } else {
                 const uri = vscode.Uri.file(file.path);
                 const content = await readTextFile(uri);
                 output += content !== null ? content : '[Skipped: Binary or Unreadable]';
            }

            output += `\n    </document_content>\n`;
            output += `  </document>\n`;
            index++;
        }
        output += '</documents>';
        return output;
    }

    const structure = buildPathTree(root);
    let output = `# Project Structure\n${structure}\n\n---\n`;

    for (const file of files) {
        const relative = path.relative(root.path, file.path);
        const lang = mapLanguage(file.name);

        output += `\n## ${relative}\n`;
        
        if (file.meta) {
            output += `> [Skipped: ${file.meta}]\n`;
        } else {
            const uri = vscode.Uri.file(file.path);
            const content = await readTextFile(uri);
            
            if (content !== null) {
                output += `\`\`\`${lang}\n${content}\n\`\`\`\n`;
            } else {
                output += `> [Skipped: Binary or Unreadable]\n`;
            }
        }
    }

    return output;
}

/**
 * Generates a flat, newline-separated list of relative paths for all selected files.
 * * @param root - The root node to traverse.
 * @returns A string containing the list of relative file paths.
 */
export function buildPathTree(root: ProjectNode): string {
    const files: ProjectNode[] = [];
    collectCheckedFiles(root, files);
    return files.map(f => {
        const rel = path.relative(root.path, f.path).replace(/\\/g, '/');
        return f.meta ? `${rel} (${f.meta})` : rel;
    }).join('\n');
}

/**
 * Generates a visual ASCII tree representation of the project structure.
 * * This function filters the tree to show only checked files and their parent directories.
 * * @param root - The root node of the project tree.
 * @returns A string representing the directory tree (e.g., using ├── symbols).
 */
export function buildAsciiTree(root: ProjectNode): string {
    let output = `${root.name}/\n`;
    
    const traverse = (node: ProjectNode, prefix: string, isLast: boolean) => {
        if (!node.children) {return;}

        const visibleChildren = node.children.filter(child => {
            if (child.type === 'file') {return child.checked;}
            return hasCheckedDescendant(child);
        });

        visibleChildren.forEach((child, index) => {
            const isChildLast = index === visibleChildren.length - 1;
            const connector = isChildLast ? '└── ' : '├── ';
            
            let displayName = child.name;
            if (child.type === 'file' && child.meta) {
                displayName += ` [${child.meta}]`;
            }

            output += `${prefix}${connector}${displayName}${child.type === 'directory' ? '/' : ''}\n`;
            
            if (child.type === 'directory') {
                const childPrefix = prefix + (isChildLast ? '    ' : '│   ');
                traverse(child, childPrefix, isChildLast);
            }
        });
    };

    traverse(root, '', true);
    return output;
}

/**
 * Recursively collects all files marked as `checked` from the project tree.
 * * @param node - The current node to inspect.
 * @param acc - The accumulator array to store selected files.
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

/**
 * Determines if a directory node contains any checked file descendants.
 * Used to prune empty directories from the visual tree.
 * * @param node - The node to check.
 * @returns `true` if the node or any of its children are checked.
 */
function hasCheckedDescendant(node: ProjectNode): boolean {
    if (node.type === 'file') {return node.checked;}
    return node.children?.some(child => hasCheckedDescendant(child)) ?? false;
}