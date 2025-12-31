// src/core/treeUtils.ts
import { ProjectNode } from '../types';
import { normalizePath } from './pathUtils';

/**
 * Updates the checkbox selection state of a specific node within the project tree.
 * * This function ensures consistency across the tree hierarchy by:
 * 1. Propagating the new state downwards to all descendants of the target node.
 * 2. Re-evaluating the state of parent nodes upwards to reflect changes (e.g., checking a parent if all children are checked).
 * * @param root - The root node of the project tree structure.
 * @param targetPath - The absolute filesystem path of the node to be toggled.
 * @param checked - The new boolean state to apply to the node.
 */
export function updateNodeCheckState(
    root: ProjectNode,
    targetPath: string,
    checked: boolean
): void {
    updateDown(root, targetPath, checked);
    updateUp(root);
}

/**
 * Recursively applies a single selection state to a node and all of its descendants.
 * * Primarily used for global "Select All" or "Uncheck All" operations.
 * * @param node - The starting node for the operation (usually the tree root).
 * @param checked - The state to apply (`true` to select, `false` to deselect).
 */
export function setAllChecked(
    node: ProjectNode,
    checked: boolean
): void {
    node.checked = checked;
    if (node.children) {
        node.children.forEach(child => setAllChecked(child, checked));
    }
}

/**
 * Filters the project tree selection to strictly include only files present in the provided Git changes set.
 * * This function modifies the tree state in-place:
 * - Files are checked only if their normalized path exists in `gitChanges`.
 * - Directories are marked as checked if they contain at least one checked descendant (to maintain visible hierarchy).
 * * @param node - The current node being evaluated.
 * @param gitChanges - A Set containing the absolute paths of files modified in Git.
 * @returns `true` if the node or any of its descendants are checked; otherwise, `false`.
 */
export function applyGitFilter(
    node: ProjectNode,
    gitChanges: Set<string>
): boolean {
    const currentPath = normalizePath(node.path);

    if (node.type === 'file') {
        node.checked = gitChanges.has(currentPath);
        return node.checked;
    }

    let anyChildChecked = false;
    if (node.children) {
        for (const child of node.children) {
            const childChecked = applyGitFilter(child, gitChanges);
            anyChildChecked = anyChildChecked || childChecked;
        }
    }

    node.checked = anyChildChecked;
    return node.checked;
}

/**
 * Traverses the tree to locate the target node and propagates the state change to its subtree.
 * * @param node - The current node during traversal.
 * @param targetPath - The path of the node user interacted with.
 * @param checked - The new state to apply.
 * @returns `true` if the target node was found in this branch.
 */
function updateDown(
    node: ProjectNode,
    targetPath: string,
    checked: boolean
): boolean {
    if (node.path === targetPath) {
        setRecursive(node, checked);
        return true;
    }

    return (
        node.children?.some(child =>
            updateDown(child, targetPath, checked)
        ) ?? false
    );
}

/**
 * Traverses the tree recursively to update directory states based on their children.
 * A directory is marked as checked only if ALL of its children are checked.
 * * @param node - The current node to evaluate.
 * @returns The final checked state of the node.
 */
function updateUp(node: ProjectNode): boolean {
    if (!node.children || node.children.length === 0) {
        return node.checked;
    }

    const allChecked = node.children.every(child =>
        updateUp(child)
    );

    node.checked = allChecked;
    return node.checked;
}

/**
 * Helper function to recursively set the checked property for a node and its children.
 * * @param node - The node to modify.
 * @param checked - The value to assign.
 */
function setRecursive(
    node: ProjectNode,
    checked: boolean
): void {
    node.checked = checked;
    node.children?.forEach(child =>
        setRecursive(child, checked)
    );
}