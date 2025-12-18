// src/data/constants.ts

/**
 * A registry of supported AI models available for selection within the extension.
 * Each entry defines the model's identifier, display name, and maximum context window size (in tokens).
 */
export const AI_MODELS = [
  { id: 'gpt-5.2', name: 'GPT-5.2', limit: 400000 },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', limit: 1000000 },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', limit: 65536 },
  { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', limit: 200000 },
  { id: 'grok-4', name: 'Grok 4.x', limit: 200000 },
  { id: 'llama-4', name: 'LLaMA 4 (128k)', limit: 128000 },
  { id: 'qwen-max', name: 'Qwen Max', limit: 1000000 },
  { id: 'qwen-standard', name: 'Qwen Standard', limit: 128000 },
];

/**
 * The fallback token limit applied when a specific model's limit cannot be determined.
 */
export const DEFAULT_TOKEN_LIMIT = 400000;