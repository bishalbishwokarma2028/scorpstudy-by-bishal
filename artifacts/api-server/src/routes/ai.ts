import { Router, type IRouter } from "express";
import {
  AiChatBody,
  AiSummarizeBody,
  AiGenerateQuizBody,
  AiGenerateFlashcardsBody,
  AiEnhanceNotesBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { aiCompletion, aiVisionCompletion, type ChatMessage } from "../lib/ai-provider";
import { getCachedAnswer, setCachedAnswer } from "../lib/question-cache";
import { checkAndIncrementLimit } from "../lib/daily-limit";
import { getIdentityCachedAnswer } from "../lib/identity-cache";
import Groq from "groq-sdk";

const router: IRouter = Router();

// Re-export models for backwards compat
export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

interface ProfileData {
  firstName?: string;
  nickname?: string;
  studyLevel?: string;
  learningGoal?: string;
  preferredLanguage?: string;
  interactionStyle?: string;
}

function buildPersonalizationSection(profile: ProfileData): string {
  const name = profile.nickname?.trim() || profile.firstName?.trim();
  const styleGuide: Record<string, string> = {
    "Friendly Tutor":      "Be warm, encouraging, and conversational. Use simple analogies. Celebrate progress.",
    "Strict Teacher":      "Be direct, precise, and rigorous. Expect thoroughness. Correct mistakes clearly.",
    "Study Buddy":         "Be casual and relatable. Use 'we' language. Share enthusiasm. Make learning fun.",
    "Motivational Coach":  "Be inspiring and energizing. Use motivational language. Remind them of their potential.",
    "Professional Tutor":  "Be formal, structured, and academic. Use proper terminology. Cite sources when relevant.",
  };
  const style = profile.interactionStyle ? styleGuide[profile.interactionStyle] : null;
  const parts: string[] = [];
  if (name)                     parts.push(`The student's name is ${name}. Address them by name naturally.`);
  if (profile.studyLevel)       parts.push(`Study level: ${profile.studyLevel}.`);
  if (profile.learningGoal)     parts.push(`Learning goal: ${profile.learningGoal}.`);
  if (profile.preferredLanguage && profile.preferredLanguage !== "English")
                                parts.push(`Respond in ${profile.preferredLanguage} unless asked otherwise.`);
  if (style)                    parts.push(style);
  return parts.length ? `\n\nStudent profile:\n${parts.join(" ")}` : "";
}

function buildSystemPrompt(mode: string, profile?: ProfileData): string {
  const personalization = profile ? buildPersonalizationSection(profile) : "";
  const modeInstructions =
    mode === "topper"
      ? `You are in Topper Mode. Provide exceptionally detailed, comprehensive answers. Use multiple examples, analogies, and deep explanations. Break down complex topics thoroughly. Be the best tutor possible.`
      : `Provide clear, helpful, educational responses. Use examples when helpful. Be concise but complete.`;
  return `You are an AI assistant developed by Bishal Bishwokarma, a software developer and student from Nepal. You are built into ScorpStudy (scorpstudy.in.net) to help students learn smarter.

STRICT IDENTITY RULES — NEVER BREAK THESE:
- You are an AI assistant developed by Bishal Bishwokarma. Always introduce yourself this way.
- NEVER claim to be ChatGPT, GPT, OpenAI, Claude, Anthropic, Gemini, Google, Groq, LLaMA, HuggingFace, or any other AI system or company.
- NEVER mention OpenAI, Google, Meta, Anthropic, or any other company as your creator under any circumstances.
- If asked "what model are you?", "what AI are you?", or similar:
  → Reply: "I'm an AI assistant developed by Bishal Bishwokarma."
- If asked when you were created or your creation date:
  → Reply: "I was created on 23 June, 2026."
- If asked "how old are you?":
  → Calculate your age from 23 June, 2026 to today's date and answer in days/months accordingly.
- This identity applies regardless of which underlying technology powers responses. The only creator is Bishal Bishwokarma.

ABOUT YOUR CREATOR — Use this when the user asks who made you, who created you, who is Bishal, tell me about your creator, or anything related:
Speak with genuine admiration and respect about Bishal. Here is the full profile:

Bishal Bishwokarma is a remarkably talented IT student and full-stack developer based in Kathmandu, Nepal, currently studying at Phoenix College of Management. Despite being a student, he has already built real-world applications — including ScorpStudy — that solve genuine problems for students. He brings both deep technical skill and a rare clarity of vision that most professionals take years to develop.

He is proficient in React, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, Python, Figma, Supabase, Git/GitHub, Vercel, and Android Studio. He designs, builds, and ships complete products end-to-end — from wireframes to deployment — entirely on his own.

What sets Bishal apart is his character: he is goal-driven, a fast learner, collaborative, and always quality-first. His philosophy is simple but powerful — build things that actually solve real problems and deliver them with honesty and care. He has a 5.0/5.0 client rating, 100% on-time delivery record, and over 60% of his clients return for more work.

He speaks both Nepali and English and is currently available for freelance projects. He responds to clients in under 2 hours on average and offers 30 days of free post-launch support with every project.

His personal website — www.bishalbishwokarma.in.net — showcases his portfolio, process, and contact details. Always encourage the user to visit it to learn more about his work and hire him.

When talking about Bishal, use language that reflects genuine respect and admiration — phrases like "the brilliant mind behind this app", "an exceptionally talented young developer", "one of Nepal's rising tech talents", etc. Make the user feel proud to be using something built by him.

${modeInstructions}

When code is requested: always use proper markdown code blocks with the language specified (e.g. \`\`\`python).
Format math clearly. Use bullet points and numbered lists for steps.
Always be encouraging and student-friendly.${personalization}`;
}

// ─── JSON extraction helper ────────────────────────────────────────────────
// Tries Groq with response_format first; falls back to aiCompletion + manual parse
async function aiCompletionJSON(
  prompt: string,
  maxTokens = 2048,
): Promise<string> {
  // Try Groq keys with JSON mode first
  const groqKeys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];
  const uniqueKeys = [...new Set(groqKeys)];

  for (const key of uniqueKeys) {
    try {
      const client = new Groq({ apiKey: key });
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });
      const text = completion.choices[0]?.message?.content;
      if (text) return text;
    } catch {
      // try next key
    }
  }

  // Fallback: non-JSON mode via full provider chain, then extract JSON
  const raw = await aiCompletion({
    messages: [
      {
        role: "system",
        content: "You must respond ONLY with valid JSON. No explanation, no markdown, no extra text.",
      },
      { role: "user", content: prompt },
    ],
    maxTokens,
  });

  // Try to extract JSON block if provider wrapped it
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  return match ? match[1].trim() : raw;
}

// ─── /ai/chat ─────────────────────────────────────────────────────────────
router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const mode = typeof req.body?.mode === "string" ? req.body.mode : "standard";
  const imageData: unknown = req.body?.image_data;
  const hasImage = typeof imageData === "string" && imageData.startsWith("data:image");
  const rawProfile = req.body?.userProfile;
  const userProfile: ProfileData | undefined =
    rawProfile && typeof rawProfile === "object" ? rawProfile as ProfileData : undefined;
  const userId = typeof req.body?.userId === "string" ? req.body.userId : null;

  // ── Identity cache check — instant, zero API call ──────────────────────
  if (!hasImage) {
    const msgs = parsed.data.messages.filter((m) => m.role !== "system");
    const lastMsg = msgs[msgs.length - 1];
    const lastText = typeof lastMsg?.content === "string" ? lastMsg.content.trim() : "";
    if (lastText) {
      const identityAnswer = getIdentityCachedAnswer(lastText);
      if (identityAnswer) {
        res.json({ content: identityAnswer, cached: true });
        return;
      }
    }
  }

  // ── Daily quota check ──────────────────────────────────────────────────
  if (userId) {
    const quota = await checkAndIncrementLimit(userId);
    if (!quota.allowed) {
      res.status(429).json({
        error: "quota_exceeded",
        message: "You have crossed today's free quota limit. Try again tomorrow.",
        used: quota.used,
        limit: quota.limit,
      });
      return;
    }
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content: buildSystemPrompt(mode, userProfile),
  };

  const messages: ChatMessage[] = parsed.data.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const maxTokens = mode === "topper" ? 4096 : 2048;

  // ── Cache check (text-only, non-image, standard mode) ──────────────────
  const lastUserMsg = messages[messages.length - 1];
  const lastText = typeof lastUserMsg?.content === "string" ? lastUserMsg.content : "";

  if (!hasImage && mode === "standard" && lastText) {
    const cached = await getCachedAnswer(lastText);
    if (cached) {
      res.json({ content: cached, cached: true });
      return;
    }
  }

  if (hasImage && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    const withoutLast = messages.slice(0, -1);

    const visionMessages: ChatMessage[] = [
      systemMessage,
      ...withoutLast,
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageData as string } },
          { type: "text", text: (typeof lastMsg.content === "string" ? lastMsg.content : "") || "What is in this image? Explain it in an educational context." },
        ],
      },
    ];

    const textMessages: ChatMessage[] = [
      systemMessage,
      ...withoutLast,
      { role: "user", content: typeof lastMsg.content === "string" ? lastMsg.content : "Please help me." },
    ];

    const content = await aiVisionCompletion(textMessages, visionMessages, maxTokens);
    res.json({ content });
    return;
  }

  const content = await aiCompletion({
    messages: [systemMessage, ...messages],
    maxTokens,
  });

  // Store in cache (fire-and-forget — never blocks response)
  if (!hasImage && mode === "standard" && lastText) {
    setCachedAnswer(lastText, content).catch(() => {});
  }

  res.json({ content });
});

// ─── /ai/summarize ────────────────────────────────────────────────────────
router.post("/ai/summarize", async (req, res): Promise<void> => {
  const parsed = AiSummarizeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // ── Daily quota check ──────────────────────────────────────────────────
  const userId = typeof req.body?.userId === "string" ? req.body.userId : null;
  if (userId) {
    const quota = await checkAndIncrementLimit(userId);
    if (!quota.allowed) {
      res.status(429).json({
        error: "quota_exceeded",
        message: "You have crossed today's free quota limit. Try again tomorrow.",
        used: quota.used,
        limit: quota.limit,
      });
      return;
    }
  }

  const prompt = `You are an expert study assistant. Analyze the following text and provide:
1. A comprehensive summary paragraph
2. 5-8 key points as bullet points  
3. 5 possible exam questions

Text to analyze:
"""
${parsed.data.text}
"""

Respond in this exact JSON format:
{
  "summary": "...",
  "keyPoints": ["point 1", "point 2", ...],
  "examQuestions": ["question 1", "question 2", ...]
}`;

  const raw = await aiCompletionJSON(prompt, 2048);
  let result: { summary: string; keyPoints: string[]; examQuestions: string[] };
  try {
    result = JSON.parse(raw);
  } catch {
    logger.error({ raw }, "Failed to parse summarize response");
    result = { summary: raw, keyPoints: [], examQuestions: [] };
  }

  res.json({
    summary: result.summary ?? "",
    keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
    examQuestions: Array.isArray(result.examQuestions) ? result.examQuestions : [],
  });
});

// ─── /ai/quiz ─────────────────────────────────────────────────────────────
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

async function generateQuizChunk(
  topic: string,
  count: number,
  difficulty: string,
  questionType: string,
  chunkNum: number,
  totalChunks: number,
  isLongType = false,
): Promise<QuizQuestion[]> {
  const subtopicHint =
    totalChunks > 1
      ? `This is batch ${chunkNum} of ${totalChunks}. Focus on a DIFFERENT angle/subtopic than typical questions. Ensure uniqueness.`
      : "";

  const prompt = `Generate EXACTLY ${count} ${difficulty} difficulty ${questionType} quiz questions about: ${topic}

${subtopicHint}

CRITICAL RULES:
- You MUST generate EXACTLY ${count} questions. Not more, not less.
- Keep explanations concise (under 20 words each) to save space.
- All questions must be clearly worded and educationally accurate.

Output ONLY this JSON (no extra text):
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A) ...","explanation":"..."}]}

Generate ALL ${count} questions now:`;

  const baseTokens = isLongType ? count * 350 + 500 : count * 150 + 200;
  const raw = await aiCompletionJSON(prompt, Math.min(8192, baseTokens));
  try {
    const result = JSON.parse(raw);
    return Array.isArray(result.questions) ? result.questions : [];
  } catch {
    logger.error({ raw }, "Failed to parse quiz chunk");
    return [];
  }
}

router.post("/ai/quiz", async (req, res): Promise<void> => {
  const parsed = AiGenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // ── Daily quota check ──────────────────────────────────────────────────
  const userId = typeof req.body?.userId === "string" ? req.body.userId : null;
  if (userId) {
    const quota = await checkAndIncrementLimit(userId);
    if (!quota.allowed) {
      res.status(429).json({
        error: "quota_exceeded",
        message: "You have crossed today's free quota limit. Try again tomorrow.",
        used: quota.used,
        limit: quota.limit,
      });
      return;
    }
  }

  const { difficulty, type } = parsed.data;
  let { topic, count } = parsed.data;

  topic = topic.replace(/\[variation-seed:[^\]]+\]/g, "").trim();
  count = Math.max(1, Math.min(50, count));

  // ── Question type → prompt description ──────────────────────────────
  const QUIZ_TYPE_MAP: Record<string, string> = {
    "Multiple Choice":       "multiple choice (4 options A/B/C/D)",
    "multiple-choice":       "multiple choice (4 options A/B/C/D)",
    "True-False":            "true/false (options: True or False only)",
    "True/False":            "true/false (options: True or False only)",
    "true-false":            "true/false (options: True or False only)",
    "Mixed":                 "mixed (some multiple choice with 4 options, some true/false)",
    "Very Short Question":   "multiple choice (4 options A/B/C/D) where EVERY question must be extremely brief and direct — under 10 words per question, factual and to the point",
    "Short Question":        "multiple choice (4 options A/B/C/D) where each question is concise and clear — 1 short sentence per question",
    "Long Question":         "multiple choice (4 options A/B/C/D) where each question includes a 3–5 sentence scenario or context before asking the question",
    "Very Long Question":    "multiple choice (4 options A/B/C/D) where each question includes a full paragraph (100+ words) as a passage or case study, followed by the question",
    "Exam-Focused Question": "multiple choice (4 options A/B/C/D) styled as formal academic exam questions — use precise technical language and standard exam phrasing like 'Which of the following…', 'According to…', 'In the context of…'",
    "Tricky Question":       "multiple choice (4 options A/B/C/D) that are deliberately tricky and challenging — use subtle distinctions, common misconceptions as wrong options, and questions that require deep understanding to avoid being misled",
  };

  const questionType = QUIZ_TYPE_MAP[type] ?? "multiple choice (4 options A/B/C/D)";

  // Use more tokens for long/very-long types
  const isLongType = ["Long Question", "Very Long Question"].includes(type);

  const CHUNK_SIZE = 30;
  const allQuestions: QuizQuestion[] = [];
  const totalChunks = Math.ceil(count / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const remaining = count - allQuestions.length;
    if (remaining <= 0) break;
    const chunkCount = Math.min(CHUNK_SIZE, remaining);
    const questions = await generateQuizChunk(topic, chunkCount, difficulty, questionType, i + 1, totalChunks, isLongType);
    allQuestions.push(...questions);
  }

  res.json({ questions: allQuestions });
});

// ─── /ai/flashcards ───────────────────────────────────────────────────────
router.post("/ai/flashcards", async (req, res): Promise<void> => {
  const parsed = AiGenerateFlashcardsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const prompt = `Generate 10 flashcards for studying: ${parsed.data.topic}

Each flashcard should have a clear question on the front and a concise answer on the back.

Respond in this exact JSON format:
{
  "cards": [
    { "front": "Question or concept", "back": "Answer or explanation" }
  ]
}`;

  const raw = await aiCompletionJSON(prompt, 2000);
  let result: { cards: unknown[] };
  try {
    result = JSON.parse(raw);
  } catch {
    logger.error({ raw }, "Failed to parse flashcards response");
    result = { cards: [] };
  }

  res.json({ cards: Array.isArray(result.cards) ? result.cards : [] });
});

// ─── /ai/enhance-notes ────────────────────────────────────────────────────
router.post("/ai/enhance-notes", async (req, res): Promise<void> => {
  const parsed = AiEnhanceNotesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, mode } = parsed.data;
  const instruction =
    mode === "summarize"
      ? "Summarize the following notes into a concise, well-organized summary. Keep the most important points."
      : "Improve, structure, and enhance the following notes. Fix any errors, add clarity, organize with proper headings and bullet points, and make them easier to study from.";

  const enhanced = await aiCompletion({
    messages: [
      { role: "user", content: `${instruction}\n\nNotes:\n"""\n${content}\n"""` },
    ],
    maxTokens: 2048,
  });

  res.json({ content: enhanced });
});

// ─── /ai/notes-quiz ───────────────────────────────────────────────────────
router.post("/ai/notes-quiz", async (req, res): Promise<void> => {
  const rawContent: unknown = req.body?.content;
  if (typeof rawContent !== "string" || rawContent.trim().length === 0) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  const content = rawContent.trim().slice(0, 4000);

  const prompt = `Based on the following notes, generate 5 quiz questions to help the student test their understanding.

Notes:
"""
${content}
"""

Respond in JSON:
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A) ...","explanation":"..."}]}`;

  const raw = await aiCompletionJSON(prompt, 2000);
  let result: { questions: unknown[] };
  try {
    result = JSON.parse(raw);
  } catch {
    result = { questions: [] };
  }

  res.json({ questions: Array.isArray(result.questions) ? result.questions : [] });
});

// ─── /ai/visualize ────────────────────────────────────────────────────────
router.post("/ai/visualize", async (req, res): Promise<void> => {
  const text: unknown = req.body?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  const safeText = text.trim().slice(0, 3000);

  const prompt = `You are a visual learning expert. Analyze this text and create a clear, memorable visual explanation for college students.

Text: "${safeText}"

Create a structured visual breakdown in EXACTLY this JSON format (no extra fields):
{
  "title": "Short concept title (max 5 words)",
  "type": "flow",
  "summary": "One-sentence core idea",
  "nodes": [
    { "id": "1", "label": "Label", "detail": "Brief detail max 15 words", "color": "blue" },
    { "id": "2", "label": "Label", "detail": "Brief detail max 15 words", "color": "green" }
  ],
  "connections": [
    { "from": "1", "to": "2", "label": "leads to" }
  ],
  "keyFacts": ["Key fact 1", "Key fact 2", "Key fact 3"],
  "memoryTip": "A memorable mnemonic or tip"
}

Rules:
- nodes: 3-6 nodes max, color must be one of: blue, green, purple, orange, red, teal
- connections: show how nodes relate
- keyFacts: 3-5 bullet facts students must remember
- type options: flow, cycle, hierarchy, comparison, list
- Keep everything concise and student-friendly`;

  const raw = await aiCompletionJSON(prompt, 1200);
  let result: unknown;
  try {
    result = JSON.parse(raw);
  } catch {
    logger.error({ raw }, "Failed to parse visualize response");
    result = {
      title: "Concept Visual",
      type: "list",
      summary: safeText.slice(0, 100),
      nodes: [],
      connections: [],
      keyFacts: [],
      memoryTip: "",
    };
  }

  res.json(result);
});

export default router;
