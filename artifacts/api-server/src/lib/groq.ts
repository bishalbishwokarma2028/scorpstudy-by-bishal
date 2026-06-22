import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

export const groq = new Groq({ apiKey });

export const GROQ_MODEL = "llama3-8b-8192";
