/** Raw chat completion request passed to a provider's API. */
export interface ChatRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Abstraction over a chat-completions provider (OpenAI-compatible).
 * Both Groq and SumoPod speak this protocol, so a single implementation
 * serves both — swap providers by changing config, not code.
 */
export interface AIProvider {
  readonly name: string;
  /** Send a request and return the full (non-streaming) completion text. */
  complete(request: ChatRequest): Promise<string>;
  /** Streaming variant yielding content deltas. */
  stream(
    request: ChatRequest,
  ): AsyncGenerator<string, void, unknown>;
}