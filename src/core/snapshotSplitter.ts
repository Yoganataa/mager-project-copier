// src/core/snapshotSplitter.ts

type Chunk = {
  index: number;
  content: string;
};

/**
 * Split snapshot into chunks that fit within token limit.
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
