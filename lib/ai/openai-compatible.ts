import type {
  AIProvider,
  ChatRequest,
  ProviderConfig,
} from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * OpenAI-compatible provider. Works with Groq, SumoPod, OpenRouter, vLLM,
 * llama.cpp and any server exposing /v1/chat/completions.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: ProviderConfig) {}

  async complete(request: ChatRequest): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ ...request, stream: false }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new ProviderHttpError(res.status, await safeBody(res));
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Provider mengembalikan respons tanpa konten.");
    }
    return content;
  }

  async *stream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ ...request, stream: true }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Provider error ${res.status}: ${await safeBody(res)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Skip malformed keep-alive frames.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export class ProviderHttpError extends ProviderError {
  constructor(
    public readonly status: number,
    body: string,
  ) {
    super(`Provider HTTP ${status}: ${body}`);
    this.name = "ProviderHttpError";
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}