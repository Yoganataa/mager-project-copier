// src/core/tokenEstimator.ts

export type TokenEstimate = {
  tokens: number;
  characters: number;
  withinLimit: boolean;
  limit: number;
};

/**
 * Conservative token estimation.
 * ~1 token per 4 characters.
 */
export function estimateTokens(
  content: string,
  limit: number
): TokenEstimate {
  const characters = content.length;
  const tokens = Math.ceil(characters / 4);

  return {
    tokens,
    characters,
    withinLimit: tokens <= limit,
    limit
  };
}
