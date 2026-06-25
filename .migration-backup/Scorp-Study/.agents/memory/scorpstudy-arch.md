---
name: ScorpStudy Architecture Decisions
description: Key non-obvious patterns, gotchas, and decisions for the ScorpStudy app.
---

## Bishal's Identity
Always lives in the BACKEND system prompt (`ai.ts` → `buildSystemPrompt()`), NOT the frontend Chat.tsx. The frontend sends `mode: "standard" | "topper"` in the request body to select the system prompt variant. Never put identity in frontend; it would get lost when the component re-renders or remounts.

**Why:** The system prompt is authoritative; putting it in the backend ensures it applies regardless of what the frontend sends.

## Quiz Question Chunking
For large question counts (30+), the `/api/ai/quiz` endpoint splits requests into chunks of 30 and runs sequential Groq calls. Each chunk uses `max_tokens: count * 150 + 200`. This ensures all requested questions are returned instead of the AI truncating output.

**Why:** Groq's llama-3.3-70b-versatile output truncates around 8192 tokens; 100 questions at ~80 tokens each exceeds this in one call.

**How to apply:** The loop in `ai.ts` runs `Math.ceil(count / 30)` chunks sequentially. Strip `[variation-seed:...]` from topic before sending to AI.

## zod/v4 in api-server
NEVER use `import { z } from "zod/v4"` in api-server routes — esbuild can't resolve it. Use manual validation (`typeof req.body?.field === "string"`) or import from `@workspace/api-zod`.

## Chat Session Persistence
Module-level `persist` object in `Chat.tsx` (`persist.messages`, `persist.sessionChatId`, etc.) survives route changes in this SPA since modules are only loaded once. Component state is synced to the module-level object on every update.

## Auto-Save to History
`autoSaveChat()` in Chat.tsx runs after every AI response. It creates a new chat record on first call (stores ID in `persist.sessionChatId`), then PATCHes subsequent updates. Backend has `GET /chats/:id` and `PATCH /chats/:id` endpoints for this.

## Chat Session Restore from History
History items link to `/dashboard/chat?sessionId=<id>`. Chat.tsx reads this URL param in a useEffect, calls `GET /api/chats/:id`, and restores the messages into module-level persist + component state.

## File Upload in Chat
Frontend: FileReader → for images: `readAsDataURL` → sent as `image_data` in JSON body. For docs: `readAsText` → prepended as `[Document: name]\n\`\`\`content\`\`\`\n\nQuestion: ...` in the user message.
Backend: if `req.body.image_data` is present and starts with `data:image`, uses `llama-3.2-11b-vision-preview` model with content array format.

## Notes Auto-Save
Notes.tsx uses a `useRef` timer (`autoSaveTimer`) cleared and reset on every content/title change, firing `doSave(silent=true)` after 1800ms idle. Save status tracked as `"saved" | "saving" | "unsaved"` displayed in the editor header.

## Note Color/Pin Persistence
Note color themes and pin state stored in `localStorage` under keys `scorpstudy-note-colors` (Record<id, colorId>) and `scorpstudy-pinned-notes` (number[]). Not in DB (schema doesn't have these fields).
