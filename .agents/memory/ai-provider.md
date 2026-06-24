---
name: Multi-provider AI fallback
description: All AI completions go through lib/ai-provider.ts which rotates Groq keys then falls back to Gemini, OpenAI, HuggingFace.
---

**Architecture:** `artifacts/api-server/src/lib/ai-provider.ts` is the single entry point for all AI calls.

- `aiCompletion(options)` — general text completion; tries Groq KEY_1/2/3/KEY → Gemini (3 keys, round-robin) → OpenAI → HuggingFace
- `aiVisionCompletion(textMsgs, visionMsgs)` — for image analysis; tries Groq vision → Groq text → Gemini
- `aiCompletionJSON(prompt)` — for routes needing JSON; tries Groq with `response_format: json_object` first, then falls back to aiCompletion + manual JSON extraction

`ai.ts` routes MUST use these helpers, never call `groq` directly.

**Env vars needed:**
- Groq: GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3, GROQ_API_KEY (fallback)
- Gemini: GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3, GEMINI_API_KEY
- OpenAI: OPENAI_API_KEY
- HuggingFace: HUGGINGFACE_API_KEY

Any missing keys are silently skipped.

**Why:** Groq free tier has rate limits. Multi-key rotation gives near-unlimited throughput. Never shows API errors to users — always returns a clean message.
