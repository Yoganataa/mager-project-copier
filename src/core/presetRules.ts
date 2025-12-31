// src/core/presetRules.ts
import { ProjectNode } from '../types';
import { normalizePath } from './pathUtils';
import { FrameworkDefinition, PresetRule } from './frameworks';

/**
 * Applies a framework's specific preset rules to the provided project file tree structure.
 * * This function performs an in-place modification of the `checked` state within the 
 * project nodes, determining which files and directories should be selected by default 
 * based on the detected framework.
 * * @param root - The root {@link ProjectNode} of the file tree to process.
 * @param framework - The {@link FrameworkDefinition} containing the rules to apply.
 */
export function applyPreset(
    root: ProjectNode,
    framework: FrameworkDefinition
): void {
    const rule = framework.preset;
    applyNode(root, rule, false);
}

/**
 * Recursively traverses the project tree to determine which nodes should be checked based on the preset rules.
 * * The logic follows this precedence:
 * 1. **Exclusion**: If a path matches the exclusion rules, it (and its children) are unchecked immediately.
 * 2. **Directory Inclusion**: If a directory matches `includeDirs`, it and all its descendants are forcibly checked.
 * 3. **File Inclusion**: If a file matches `includeFiles` (or is inheriting a forced check), it is checked.
 * * @param node - The current project node being evaluated.
 * @param rule - The set of inclusion and exclusion rules.
 * @param forceInclude - A flag indicating if the parent directory mandates inclusion of its children.
 * @returns `true` if the current node is marked as checked, otherwise `false`.
 */
function applyNode(
    node: ProjectNode,
    rule: PresetRule,
    forceInclude: boolean
): boolean {
    const path = normalizePath(node.path);

    if (rule.exclude.some(r => r.test(path))) {
        node.checked = false;
        if (node.children) {
            node.children.forEach(child => uncheckAll(child));
        }
        return false;
    }

    if (node.type === 'directory') {
        const dirName = path.split('/').pop() ?? '';
        
        const isIncludeRoot = rule.includeDirs.includes(dirName);
        
        const nextForceInclude = forceInclude || isIncludeRoot;

        let anyChildChecked = false;

        node.children?.forEach(child => {
            const childChecked = applyNode(
                child,
                rule,
                nextForceInclude
            );
            anyChildChecked = anyChildChecked || childChecked;
        });

        node.checked = isIncludeRoot || anyChildChecked;
        return node.checked;
    }

    if (forceInclude) {
        node.checked = true;
        return true;
    }

    const included = rule.includeFiles.some(r => r.test(path));
    node.checked = included;
    return node.checked;
}

/**
 * Recursively sets the `checked` state to `false` for a node and all its descendants.
 * Used when a parent directory is explicitly excluded.
 * * @param node - The node to uncheck.
 */
function uncheckAll(node: ProjectNode) {
    node.checked = false;
    node.children?.forEach(uncheckAll);
}