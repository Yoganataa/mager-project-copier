// src/core/snapshotSplitter.ts

/**
 * Represents a segmented portion of a larger snapshot text.
 */
type Chunk = {
  /** The sequence number of the chunk (1-based index). */
  index: number;
  /** The text content of this specific chunk. */
  content: string;
};

/**
 * Splits a large snapshot string into smaller sequential chunks to ensure they fit within specific token limits.
 * * This function uses a heuristic where 1 token is approximately equal to 4 characters to estimate the chunk size.
 * It iterates through the snapshot line by line to avoid breaking the text in the middle of a line.
 *
 * @param snapshot - The complete snapshot string to be split.
 * @param maxTokens - The maximum number of tokens allowed per chunk.
 * @returns An array of {@link Chunk} objects containing the segmented content.
 */
export function splitSnapshot(
  snapshot: string,
  maxTokens: number
): Chunk[] {
  const maxChars = maxTokens * 4;
  const lines = snapshot.split('\n');

  const chunks: Chunk[] = [];
  let current = '';
  let index = 1;

  for (const line of lines) {
    if ((current + line).length > maxChars) {
      chunks.push({
        index,
        content: current
      });
      index++;
      current = '';
    }

    current += line + '\n';
  }

  if (current.trim()) {
    chunks.push({
      index,
      content: current
    });
  }

  return chunks;
}