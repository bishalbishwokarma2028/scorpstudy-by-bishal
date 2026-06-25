import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

export const groq = new Groq({ apiKey });

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
