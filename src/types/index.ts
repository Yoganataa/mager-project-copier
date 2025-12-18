// src/types/index.ts

/**
 * Represents a node in the project's file system hierarchy.
 * * This interface is used to construct the interactive tree view in the sidebar
 * and track the selection state of files and directories.
 */
export interface ProjectNode {
  /** The absolute file system path of the node. */
  path: string;

  /** The name of the file or directory (e.g., 'index.ts', 'src'). */
  name: string;

  /** The type of the node, distinguishing between files and directories. */
  type: 'file' | 'directory';

  /**
   * Indicates whether the node is currently selected (checked) in the UI.
   * * For directories, a checked state typically implies that its contents
   * are partially or fully selected, depending on the implementation logic.
   */
  checked: boolean;

  /**
   * An array of child nodes, if the current node is a directory.
   * * This property is undefined for nodes of type 'file'.
   */
  children?: ProjectNode[];
}