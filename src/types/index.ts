// src/types/index.ts

/**
 * Represents a node in the project file tree.
 */
export interface ProjectNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  checked: boolean;
  children?: ProjectNode[];
}
