import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const aiClient = new GoogleGenAI({
  apiKey: apiKey || "",
});

interface GenerateContentOptions {
  model?: string;
  contents: any;
  config?: any;
}

export async function generateContentWithFallback(
  options: GenerateContentOptions,
  retries = 2,
  delayMs = 1000
): Promise<any> {
  const requestedModel = options.model || "gemini-2.5-flash";

  // Define fallback chain of models to try in order
  const fallbackModels = [
    requestedModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  // De-duplicate while preserving order
  const modelsToTry = Array.from(new Set(fallbackModels));
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempt = 1;
    while (attempt <= retries) {
      try {
        const response = await aiClient.models.generateContent({
          ...options,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorMsg = err?.message || String(err);

        const isRetryable =
          errorMsg.includes("503") ||
          errorMsg.includes("429") ||
          errorMsg.toLowerCase().includes("quota") ||
          errorMsg.toLowerCase().includes("rate limit") ||
          errorMsg.toLowerCase().includes("resource_exhausted") ||
          errorMsg.toLowerCase().includes("unavailable") ||
          errorMsg.toLowerCase().includes("demand");

        if (isRetryable && attempt < retries) {
          console.warn(
            `Gemini call failed for model ${model} (attempt ${attempt}/${retries}). Retrying in ${delayMs * attempt}ms... Error: ${errorMsg}`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
          attempt++;
        } else {
          console.warn(
            `Model ${model} failed (Error: ${errorMsg}). Trying next fallback model...`
          );
          break; // Break retry loop, try next model in fallback list
        }
      }
    }
  }

  throw lastError;
}
