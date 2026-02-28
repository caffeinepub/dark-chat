import type { OpenRouterModel } from "../types/chat";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const APP_URL = "https://darkchat.app";
const APP_NAME = "DARK CHAT";

// Priority free models — fastest models first for lowest latency
// Updated with currently active OpenRouter free models (as of 2026)
const PREFERRED_VISION_FREE = [
  // --- FASTEST: Gemini Flash (Google's lowest-latency inference) ---
  "google/gemini-2.0-flash-001:free",
  "google/gemini-2.5-flash:free",
  "google/gemini-2.0-flash-lite-001:free",
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-flash-1.5:free",
  "google/gemini-2.0-flash-thinking-exp:free",
  // --- FAST: Qwen vision models ---
  "qwen/qwen2.5-vl-7b-instruct:free",
  "qwen/qwen2.5-vl-3b-instruct:free",
  "qwen/qwen2-vl-7b-instruct:free",
  // --- FAST: Small Llama vision ---
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  // --- FAST: Small text models ---
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "microsoft/phi-3.5-mini-128k-instruct:free",
  // --- MEDIUM: Mid-size models ---
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "mistralai/mistral-nemo:free",
  "qwen/qwen3-14b:free",
  "qwen/qwen3-8b:free",
  "qwen/qwen3-4b:free",
  "qwen/qwen2.5-7b-instruct:free",
  "qwen/qwen2.5-14b-instruct:free",
  // --- SLOWER: Large models (fallback only) ---
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.2-90b-vision-instruct:free",
  "qwen/qwen2.5-72b-instruct:free",
  "qwen/qwen3-30b-a3b:free",
  "qwen/qwen3-32b:free",
  "microsoft/phi-4:free",
  "microsoft/phi-4-reasoning-plus:free",
  "deepseek/deepseek-chat:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-r1-zero:free",
  "deepseek/deepseek-r1-distill-llama-70b:free",
];

// In-memory list of all detected free models (populated at runtime)
let cachedFreeModels: string[] = [];

function isVisionModel(model: OpenRouterModel): boolean {
  const modality = model.architecture?.modality ?? "";
  const inputModalities = model.architecture?.input_modalities ?? [];
  return (
    modality.includes("image") ||
    inputModalities.includes("image") ||
    modality.includes("multimodal")
  );
}

function isFreeModel(
  modelId: string,
  pricing?: { prompt?: string; completion?: string },
): boolean {
  // Models explicitly tagged as free
  if (modelId.endsWith(":free")) return true;
  // Models with zero cost pricing
  if (pricing) {
    const promptCost = Number.parseFloat(pricing.prompt ?? "1");
    const completionCost = Number.parseFloat(pricing.completion ?? "1");
    if (promptCost === 0 && completionCost === 0) return true;
  }
  return false;
}

export async function fetchBestModel(apiKey: string): Promise<string> {
  try {
    const response = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data ?? [];

    // Build a lookup set
    const availableIds = new Set(models.map((m) => m.id));

    // Collect all free models ordered by priority
    const freeVisionModels = models
      .filter(
        (m) =>
          isFreeModel(m.id, m.pricing) &&
          isVisionModel(m) &&
          m.context_length > 0,
      )
      .sort((a, b) => b.context_length - a.context_length)
      .map((m) => m.id);

    const freeTextModels = models
      .filter(
        (m) =>
          isFreeModel(m.id, m.pricing) &&
          !isVisionModel(m) &&
          m.context_length > 0,
      )
      .sort((a, b) => b.context_length - a.context_length)
      .map((m) => m.id);

    // Build ordered list: live free models first (ranked by context), then preferred fallbacks
    // Prioritize models actually available from the API over hardcoded list
    const orderedFree: string[] = [];

    // First add any preferred models that are confirmed available
    for (const preferred of PREFERRED_VISION_FREE) {
      if (availableIds.has(preferred) && !orderedFree.includes(preferred)) {
        orderedFree.push(preferred);
      }
    }

    // Add all discovered free vision models (sorted: smaller = faster)
    const sortedVision = freeVisionModels.sort((a, b) => {
      const mA = models.find((m) => m.id === a);
      const mB = models.find((m) => m.id === b);
      return (mA?.context_length ?? 999999) - (mB?.context_length ?? 999999);
    });
    for (const id of sortedVision) {
      if (!orderedFree.includes(id)) orderedFree.push(id);
    }

    // Add all discovered free text models
    const sortedText = freeTextModels.sort((a, b) => {
      const mA = models.find((m) => m.id === a);
      const mB = models.find((m) => m.id === b);
      return (mA?.context_length ?? 999999) - (mB?.context_length ?? 999999);
    });
    for (const id of sortedText) {
      if (!orderedFree.includes(id)) orderedFree.push(id);
    }

    // Cache the full list for rotation later
    if (orderedFree.length > 0) {
      cachedFreeModels = orderedFree;
      return orderedFree[0];
    }

    // Absolute fallback — use fastest reliable free model
    cachedFreeModels = PREFERRED_VISION_FREE.slice(0, 10);
    return PREFERRED_VISION_FREE[0];
  } catch {
    // Fallback list if models API fails
    cachedFreeModels = PREFERRED_VISION_FREE.slice();
    return PREFERRED_VISION_FREE[0];
  }
}

/** Get the next available free model to try after a rate-limit failure */
export function getNextFreeModel(currentModelId: string): string | null {
  // If cache is empty, populate with fallback list so we always have options
  if (cachedFreeModels.length === 0) {
    cachedFreeModels = PREFERRED_VISION_FREE.slice();
  }
  const idx = cachedFreeModels.indexOf(currentModelId);
  // If current model not found or is last, wrap around to first (or return second to first)
  if (idx === -1) return cachedFreeModels[0] ?? null;
  if (idx >= cachedFreeModels.length - 1) return cachedFreeModels[0] ?? null;
  return cachedFreeModels[idx + 1];
}

/** Small delay helper for retry backoff */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface StreamChunk {
  content?: string;
  done: boolean;
  error?: string;
  /** Set when the error is a rate-limit and we've rotated to a new model */
  rotatedToModel?: string;
}

export async function* streamChatCompletion(
  apiKey: string,
  modelId: string,
  messages: Array<{
    role: string;
    content:
      | string
      | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }>,
  onError?: (err: string) => void,
): AsyncGenerator<StreamChunk> {
  // Attempt with rotation on rate limit — try many models before giving up
  let currentModel = modelId;
  const maxAttempts = 20; // try up to 20 different models
  const triedModels = new Set<string>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    triedModels.add(currentModel);

    const result = await attemptStreamChatCompletion(
      apiKey,
      currentModel,
      messages,
    );

    if (result.type === "success") {
      // Yield all chunks from the stream
      for await (const chunk of result.stream) {
        yield chunk;
      }
      return;
    }

    if (result.type === "data_policy") {
      // Data policy error — show actionable fix, do not rotate
      if (onError) onError(result.error);
      yield { done: true, error: result.error };
      return;
    }

    if (result.type === "rate_limit") {
      // Find next model that hasn't been tried yet
      let nextModel: string | null = null;
      // Ensure cache is populated
      if (cachedFreeModels.length === 0) {
        cachedFreeModels = PREFERRED_VISION_FREE.slice();
      }
      for (const m of cachedFreeModels) {
        if (!triedModels.has(m)) {
          nextModel = m;
          break;
        }
      }

      if (nextModel) {
        // Brief pause then silently rotate to next model and retry
        await delay(150);
        currentModel = nextModel;
        yield { content: undefined, done: false, rotatedToModel: nextModel };
        continue;
      }

      // All known models tried — give a helpful message
      const errorMsg =
        "All free models are currently busy. Please wait a minute and try again, " +
        "or add credits at openrouter.ai/credits to unlock paid access.";
      if (onError) onError(errorMsg);
      yield { done: true, error: errorMsg };
      return;
    }

    // Non-rate-limit error — yield immediately
    if (onError) onError(result.error);
    yield { done: true, error: result.error };
    return;
  }

  const errorMsg =
    "All free models are currently busy or unavailable. Please wait 1-2 minutes and try again — free model capacity resets regularly.";
  if (onError) onError(errorMsg);
  yield { done: true, error: errorMsg };
}

type AttemptResult =
  | { type: "success"; stream: AsyncGenerator<StreamChunk> }
  | { type: "rate_limit" }
  | { type: "data_policy"; error: string }
  | { type: "error"; error: string };

async function attemptStreamChatCompletion(
  apiKey: string,
  modelId: string,
  messages: Array<{
    role: string;
    content:
      | string
      | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }>,
): Promise<AttemptResult> {
  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": APP_NAME,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
        max_tokens: 2048,
      }),
    });
  } catch {
    return {
      type: "error",
      error: "Network error. Please check your connection.",
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    let rawMsg = `API error ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      rawMsg = errorJson?.error?.message ?? rawMsg;
    } catch {
      // ignore
    }

    const lowerMsg = rawMsg.toLowerCase();

    // Detect data policy / free model publication error — show actionable fix
    if (
      lowerMsg.includes("data policy") ||
      lowerMsg.includes("free model publication") ||
      lowerMsg.includes("no endpoints found matching")
    ) {
      return {
        type: "data_policy",
        error:
          "⚠️ Action required: OpenRouter requires you to enable free model access.\n\n" +
          "Fix it in 10 seconds:\n" +
          "1. Go to https://openrouter.ai/settings/privacy\n" +
          '2. Enable "Allow free model access" (or toggle the data policy option)\n' +
          "3. Save, then come back and send your message again.\n\n" +
          "This is a one-time setting in your OpenRouter account.",
      };
    }

    // Treat ALL 429s as rate limits — rotate to next model automatically
    if (
      response.status === 429 ||
      lowerMsg.includes("rate limit") ||
      lowerMsg.includes("free-models-per-day") ||
      lowerMsg.includes("too many requests")
    ) {
      return { type: "rate_limit" };
    }

    let errorMsg = rawMsg;
    if (response.status === 401) {
      errorMsg =
        "Invalid API key. Please check your OpenRouter key — it should start with 'sk-or-'. " +
        "Update it via the settings icon in the top-right.";
    } else if (response.status === 402) {
      errorMsg = "Insufficient credits. Add credits at openrouter.ai/credits.";
    } else if (response.status === 498 || response.status === 503) {
      // Treat 498 / 503 (service unavailable) as temporary — rotate model
      return { type: "rate_limit" };
    }

    return { type: "error", error: errorMsg };
  }

  if (!response.body) {
    return { type: "error", error: "No response body from API." };
  }

  return { type: "success", stream: parseStream(response.body) };
}

async function* parseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") {
        yield { done: true };
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta != null) {
          yield { content: delta, done: false };
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  yield { done: true };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
