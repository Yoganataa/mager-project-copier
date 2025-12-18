// src/utils/languageMapper.ts

/**
 * Maps a given filename to a Markdown-compatible language identifier.
 * * This function is used to ensure that code blocks in the generated snapshot
 * have correct syntax highlighting when consumed by AI models or rendered in Markdown viewers.
 *
 * @param fileName - The full name of the file, including its extension.
 * @returns The string identifier for the language (e.g., 'ts', 'python'), or an empty string if the extension is unrecognized.
 */
export function mapLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts': return 'ts';
    case 'tsx': return 'tsx';
    case 'js': return 'js';
    case 'jsx': return 'jsx';
    case 'json': return 'json';
    case 'md': return 'md';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'lua': return 'lua';
    case 'py': return 'py';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'java': return 'java';
    case 'php': return 'php';
    case 'sql': return 'sql';
    case 'env': return 'env';
    case 'sh': return 'bash';
    default: return '';
  }
}