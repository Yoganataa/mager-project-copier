// src/types/index.ts

/**
 * Represents a single node within the hierarchical project structure.
 * * This interface maps directly to a file or directory in the user's filesystem
 * and serves as the core data model for the interactive sidebar tree view.
 */
export interface ProjectNode {
  /**
   * The absolute filesystem path of the node.
   * Used as the unique identifier for file operations and Git filtering.
   */
  path: string;

  /**
   * The display name of the file or directory (e.g., `index.ts`, `src`).
   */
  name: string;

  /**
   * Categorizes the node as either a file or a directory.
   */
  type: 'file' | 'directory';

  /**
   * The current selection state of the node in the UI.
   * * `true`: The node is selected for inclusion in the snapshot.
   * * `false`: The node is excluded.
   */
  checked: boolean;

  /**
   * An optional array of child nodes.
   * This property is only present if the node `type` is `'directory'`.
   */
  children?: ProjectNode[];

  /**
   * Optional metadata providing context on why a file's content might be skipped.
   * * Examples: `'Binary'`, `'Large (>1MB)'`.
   * * If defined, the file appears in the tree structure, but its content is 
   * excluded from the generated snapshot to conserve tokens.
   */
  meta?: string;
}