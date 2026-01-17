import * as path from 'path';

/**
 * Scans file content to identify local relative imports.
 * @param content - The raw string content of the file.
 * @returns A list of relative import paths (e.g., './utils', '../types').
 */
export function findLocalImports(content: string): string[] {
    const imports: string[] = [];
    
    // Regex matches:
    // 1. import ... from '...'
    // 2. export ... from '...'
    // 3. require('...')
    // Captures only paths starting with . or ..
    
    // Static imports/exports
    const staticImportRegex = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
    let match;
    while ((match = staticImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // require() calls
    const requireRegex = /require\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

/**
 * Resolves a list of relative imports to absolute paths based on the source file's location.
 * @param sourcePath - The absolute path of the file containing the imports.
 * @param importPaths - The list of relative import strings.
 * @returns A list of potential absolute file paths (resolving extensions).
 */
export function resolveImportPaths(sourcePath: string, importPaths: string[]): string[] {
    const dir = path.dirname(sourcePath);
    const resolved: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.json', '/index.ts', '/index.js'];

    for (const imp of importPaths) {
        const absBase = path.join(dir, imp);
        
        // Exact match (rare for imports, but possible)
        resolved.push(absBase);
        
        // Try extensions
        for (const ext of extensions) {
            resolved.push(absBase + ext);
        }
    }
    
    return resolved;
}
