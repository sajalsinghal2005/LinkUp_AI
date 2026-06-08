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
  retries = 3,
  delayMs = 1000
): Promise<any> {
  const modelToUse = options.model || "gemini-2.5-flash";
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await aiClient.models.generateContent({
        ...options,
        model: modelToUse,
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
          `Gemini call failed (attempt ${attempt}/${retries}). Retrying in ${delayMs * attempt}ms... Error: ${errorMsg}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      } else {
        break;
      }
    }
  }

  // Fallback to gemini-1.5-flash if we started with gemini-2.5-flash
  if (modelToUse === "gemini-2.5-flash") {
    console.warn(`gemini-2.5-flash failed or experienced high demand. Falling back to gemini-1.5-flash...`);
    try {
      const response = await aiClient.models.generateContent({
        ...options,
        model: "gemini-1.5-flash",
      });
      return response;
    } catch (fallbackErr: any) {
      console.error("Fallback to gemini-1.5-flash also failed:", fallbackErr);
      throw fallbackErr;
    }
  }

  throw lastError;
}
