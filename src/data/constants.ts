// src/data/constants.ts

/**
 * Supported output formats for the snapshot generation.
 */
export const OUTPUT_FORMATS = [
  { id: 'markdown', name: 'Markdown (Standard)' },
  { id: 'xml', name: 'XML (Claude Optimized)' },
  // Bisa ditambahkan format lain di masa depan, misal: JSON, Text
];

/**
 * Default safe token limit for warning purposes.
 * Since specific model limits are removed, we use a generous generic limit (e.g., 200k).
 */
export const DEFAULT_TOKEN_LIMIT = 200000;