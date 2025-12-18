// src/core/presetRules.ts
import { ProjectNode } from '../types';
import { normalizePath } from './pathUtils';

type PresetRule = {
  includeDirs: string[];
  includeFiles: RegExp[];
  exclude: RegExp[];
};

const PRESETS: Record<string, PresetRule> = {
  node: {
    includeDirs: ['src', 'lib', 'config'],
    includeFiles: [
      /package\.json$/,
      /tsconfig/,
      /\.env/
    ],
    exclude: [
      /node_modules/,
      /dist/,
      /build/,
      /logs/
    ]
  },

  next: {
    includeDirs: ['app', 'pages', 'components', 'lib'],
    includeFiles: [
      /next\.config/,
      /package\.json$/,
      /tsconfig/
    ],
    exclude: [
      /node_modules/,
      /\.next/,
      /out/
    ]
  },

  laravel: {
    includeDirs: ['app', 'routes', 'config'],
    includeFiles: [
      /composer\.json$/,
      /\.env/
    ],
    exclude: [
      /vendor/,
      /storage/
    ]
  },

  python: {
    includeDirs: ['src'],
    includeFiles: [
      /\.py$/,
      /requirements\.txt$/,
      /pyproject\.toml$/
    ],
    exclude: [
      /__pycache__/,
      /\.venv/
    ]
  },

  go: {
    includeDirs: ['cmd', 'internal', 'pkg'],
    includeFiles: [
      /\.go$/,
      /go\.mod$/,
      /go\.sum$/
    ],
    exclude: [/vendor/]
  }
};

/**
 * Apply preset rules to the project tree.
 * This function is intentionally deterministic and recursive.
 */
export function applyPreset(
  root: ProjectNode,
  preset: keyof typeof PRESETS
): void {
  const rule = PRESETS[preset];
  applyNode(root, rule, false);
}

/**
 * @param forceInclude - if true, all descendants are forced checked
 */
function applyNode(
  node: ProjectNode,
  rule: PresetRule,
  forceInclude: boolean
): boolean {
  const path = normalizePath(node.path);

  // Exclude always wins
  if (rule.exclude.some(r => r.test(path))) {
    node.checked = false;
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

  // file
  if (forceInclude) {
    node.checked = true;
    return true;
  }

  const included =
    rule.includeFiles.some(r => r.test(path));

  node.checked = included;
  return node.checked;
}
