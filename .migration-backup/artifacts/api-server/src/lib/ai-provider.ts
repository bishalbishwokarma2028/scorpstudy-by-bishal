import Groq from "groq-sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

export type CompletionOptions = {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
};

// ─── Groq clients ──────────────────────────────────────────────────────────
function makeGroqClients(): Groq[] {
  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];
  const unique = [...new Set(keys)];
  return unique.map((k) => new Groq({ apiKey: k }));
}

// ─── Gemini clients (round-robin) ──────────────────────────────────────────
let geminiIdx = 0;
function nextGeminiClient(): GoogleGenerativeAI | null {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY,
  ].filter(Boolean) as string[];
  if (!keys.length) return null;
  const key = keys[geminiIdx % keys.length];
  geminiIdx++;
  return new GoogleGenerativeAI(key);
}

// ─── OpenAI client ─────────────────────────────────────────────────────────
function makeOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

// ─── HuggingFace fallback (HTTP) ──────────────────────────────────────────
async function huggingFaceCompletion(messages: ChatMessage[]): Promise<string | null> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) return null;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const prompt = typeof lastUser?.content === "string" ? lastUser.content : "Hello";
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 800 } }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ generated_text?: string }>;
    const text = data[0]?.generated_text ?? "";
    return text.replace(prompt, "").trim() || null;
  } catch {
    return null;
  }
}

// ─── Groq: try each key in order ──────────────────────────────────────────
async function tryGroq(options: CompletionOptions): Promise<string | null> {
  const clients = makeGroqClients();
  for (const client of clients) {
    try {
      const completion = await client.chat.completions.create({
        model: options.model ?? GROQ_MODEL,
        messages: options.messages as Parameters<
          typeof client.chat.completions.create
        >[0]["messages"],
        max_tokens: options.maxTokens ?? 2048,
      });
      return completion.choices[0]?.message?.content ?? null;
    } catch {
      // try next key
    }
  }
  return null;
}

// ─── Gemini: rotate keys ───────────────────────────────────────────────────
async function tryGemini(options: CompletionOptions): Promise<string | null> {
  const client = nextGeminiClient();
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemMsg = options.messages.find((m) => m.role === "system");
    const userMsgs = options.messages.filter((m) => m.role !== "system");

    const history = userMsgs.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
    }));

    const lastMsg = userMsgs[userMsgs.length - 1];
    const lastText = typeof lastMsg?.content === "string"
      ? lastMsg.content
      : (lastMsg?.content as Array<{ type: string; text?: string }>)
          .find((p) => p.type === "text")?.text ?? "";

    const chat = model.startChat({
      history,
      systemInstruction: systemMsg ? (typeof systemMsg.content === "string" ? systemMsg.content : "") : undefined,
    });
    const result = await chat.sendMessage(lastText);
    return result.response.text() || null;
  } catch {
    return null;
  }
}

// ─── OpenAI fallback ───────────────────────────────────────────────────────
async function tryOpenAI(options: CompletionOptions): Promise<string | null> {
  const client = makeOpenAIClient();
  if (!client) return null;
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: options.messages as Parameters<
        typeof client.chat.completions.create
      >[0]["messages"],
      max_tokens: options.maxTokens ?? 1024,
    });
    return completion.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ─── Main completion function ──────────────────────────────────────────────
export async function aiCompletion(options: CompletionOptions): Promise<string> {
  // 1. Try all Groq keys
  const groqResult = await tryGroq(options);
  if (groqResult) return groqResult;

  // 2. Try Gemini (up to 3 keys via rotation)
  for (let i = 0; i < 3; i++) {
    const geminiResult = await tryGemini(options);
    if (geminiResult) return geminiResult;
  }

  // 3. Try OpenAI
  const openaiResult = await tryOpenAI(options);
  if (openaiResult) return openaiResult;

  // 4. Try HuggingFace
  const hfResult = await huggingFaceCompletion(options.messages);
  if (hfResult) return hfResult;

  // 5. All providers failed
  return "AI is busy right now, please try again in a moment.";
}

// ─── Vision-specific completion (Groq vision → Groq text fallback → Gemini) ─
export async function aiVisionCompletion(
  textMessages: ChatMessage[],
  visionMessages: ChatMessage[],
  maxTokens = 2048,
): Promise<string> {
  // 1. Try Groq vision
  const groqVision = await tryGroq({ messages: visionMessages, model: VISION_MODEL, maxTokens });
  if (groqVision) return groqVision;

  // 2. Fall back to Groq text-only
  const groqText = await tryGroq({ messages: textMessages, maxTokens });
  if (groqText) return groqText;

  // 3. Fall back to Gemini (handles images differently — just send text context)
  const gemini = await tryGemini({ messages: textMessages, maxTokens });
  if (gemini) return gemini;

  return "I couldn't analyze the image. Please describe your question in text instead.";
}
