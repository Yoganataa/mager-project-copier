// src/core/tokenEstimator.ts

/**
 * Represents the result of a token estimation calculation.
 */
export type TokenEstimate = {
  /** The estimated number of tokens based on character count. */
  tokens: number;
  /** The total number of characters in the content. */
  characters: number;
  /** Indicates whether the estimated token count is within the specified limit. */
  withinLimit: boolean;
  /** The maximum token limit used for comparison. */
  limit: number;
};

/**
 * Performs a conservative estimation of the token count for a given string.
 * * This function uses a standard heuristic where approximately 4 characters equal 1 token.
 * It is intended for quick client-side validation before sending data to an LLM API.
 *
 * @param content - The text content to analyze.
 * @param limit - The maximum allowed token count to check against.
 * @returns A {@link TokenEstimate} object containing the statistics and validation result.
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