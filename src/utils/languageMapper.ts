// src/utils/languageMapper.ts

/**
 * Maps a file name to a Markdown code fence language.
 * This is optimized for AI consumption.
 *
 * @param fileName - File name with extension
 * @returns Markdown language identifier
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
