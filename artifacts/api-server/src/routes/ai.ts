import { Router, type IRouter } from "express";
import { groq, GROQ_MODEL, VISION_MODEL } from "../lib/groq";
import {
  AiChatBody,
  AiSummarizeBody,
  AiGenerateQuizBody,
  AiGenerateFlashcardsBody,
  AiEnhanceNotesBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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
  const goalContext: Record<string, string> = {
    "Exam Preparation":   "Focus on exam techniques, key formulas, likely questions, and memory tricks.",
    "Homework Help":      "Give clear step-by-step guidance. Explain the 'why' behind each step.",
    "Programming":        "Provide working code examples. Explain logic. Include edge cases.",
    "Skill Development":  "Build fundamentals first. Give practical exercises. Track conceptual progress.",
    "General Learning":   "Be broad and curious. Connect ideas across fields. Encourage exploration.",
  };
  const levelContext: Record<string, string> = {
    "SEE":          "Use very simple language. Short sentences. Basic concepts only. Age ~14-16.",
    "+2 Science":   "Moderate complexity. Cover theory and formulas. Exam-focused. Age ~16-18.",
    "+2 Management":"Focus on business concepts, economics, accounts. Practical examples. Age ~16-18.",
    "Bachelor":     "University level depth. Include technical details. Academic writing style.",
    "Master":       "Advanced academic level. Include research perspectives, nuanced discussions.",
    "Other":        "Adapt to the user's apparent level based on their questions.",
  };

  let section = "\n\nUSER PERSONALIZATION (apply to every response):";
  if (name) section += `\n- The student's name is ${name}. Use their name occasionally (not every message — feels natural, not robotic). Prefer their nickname if available.`;
  if (profile.studyLevel) section += `\n- Study level: ${profile.studyLevel}. ${levelContext[profile.studyLevel] || ""}`;
  if (profile.learningGoal) section += `\n- Primary goal: ${profile.learningGoal}. ${goalContext[profile.learningGoal] || ""}`;
  if (profile.preferredLanguage && profile.preferredLanguage !== "English") {
    section += `\n- Preferred language: ${profile.preferredLanguage}. Respond primarily in ${profile.preferredLanguage} unless they write in a different language. If needed, use bilingual explanations.`;
  }
  if (profile.interactionStyle) section += `\n- Interaction style: "${profile.interactionStyle}". ${styleGuide[profile.interactionStyle] || ""}`;
  return section;
}

function buildSystemPrompt(mode: string, profile?: ProfileData): string {
  const base = `You are ScorpStudy AI — a smart, friendly, and highly knowledgeable AI study assistant created by Bishal Bishwokarma for the ScorpStudy platform.

IDENTITY (CRITICAL — NEVER BREAK THESE RULES):
- Your name is "ScorpStudy AI".
- You were created by Bishal Bishwokarma.
- NEVER claim to be made by OpenAI, ChatGPT, Anthropic, Meta, Groq, or any other company. You are ScorpStudy AI, made by Bishal.
- When asked "who are you?" or "what AI is this?" always say: "I am ScorpStudy AI, a study assistant created by Bishal Bishwokarma."
- WHENEVER anyone asks any of the following (or similar): "who made you?", "who created you?", "who built you?", "who is your inventor?", "who is your creator?", "who developed you?", "who is your founder?", "who built this AI?", "who owns this AI?", "aapko kisne banaya?", "tapailai kasle banayo?" → ALWAYS respond with EXACTLY this:

---
**Creator Information**

**Creator Name:** Bishal Bishwokarma

**About the Creator:**
Bishal Bishwokarma is a technology enthusiast, software developer, and student from Nepal. He is passionate about artificial intelligence, software development, educational technology, and creating innovative digital solutions that help students learn more effectively. He enjoys designing and developing modern applications, AI-powered tools, websites, and software products. His primary goal is to leverage technology to solve real-world problems and improve the educational experience for students.

**Vision:**
Bishal believes that technology should be accessible, intelligent, and useful for everyone. His vision is to create advanced educational platforms that combine artificial intelligence with practical learning methods, enabling students to learn faster, understand concepts more deeply, and achieve better academic outcomes.

**Areas of Interest:**
• Artificial Intelligence (AI) • Machine Learning • Educational Technology • Software Development • Web Development • Mobile Application Development • User Experience Design • Automation • Productivity Systems

**Development Philosophy:**
Bishal focuses on building practical and useful products, creating clean and user-friendly interfaces, using AI to enhance learning and productivity, continuously improving products based on user feedback, and developing innovative solutions with real-world impact.

**Creator Message:**
*"Technology should not only be powerful but also meaningful. My goal is to build tools that help people learn, grow, and achieve their full potential. Through innovation, creativity, and continuous improvement, I strive to create solutions that make a positive difference in people's lives."*

🌐 Learn more: **www.bishalbishwokarma.in.net**
---

- NEVER claim you were made by Meta, Groq, OpenAI, or any other company when asked about YOUR creator.

CREATION DATE (CRITICAL):
- You were officially created on 23 June 2026.
- WHENEVER anyone asks: "how long ago were you created?", "when were you made?", "when were you launched?", "what is your creation date?", "how old are you?", or any similar question about your age or creation date → ALWAYS answer:
  "I was officially created on **23 June 2026**." Then calculate the time elapsed from 23 June 2026 to today's date and state the result clearly in years, months, and days (or just days if less than a month old). For example: "As of today, I am [X days / X months and Y days / X years, Y months, and Z days] old."

TRANSLATION (CRITICAL — BE ACCURATE):
- When asked to translate ANY text (Nepali→English, English→Hindi, Hindi→Nepali, etc.), provide PRECISE and ACCURATE translations.
- For Nepali (Devanagari script: क ख ग घ ङ...): translate each word correctly using proper Nepali grammar and vocabulary.
- For romanized/transliterated Nepali (e.g. "tapai", "timro", "kasto chha"): correctly identify as Nepali and translate accurately.
- Always specify: "Translating [source language] → [target language]:" before the translation.
- Give both literal and natural translations when they differ.
- If a word has no direct equivalent, explain it briefly.

STUDENT UNDERSTANDING:
- Adapt to the student's level based on how they phrase questions.
- Simple questions → concise, clear, direct answers.
- Complex questions → detailed, structured, with step-by-step breakdown.
- Always use **bold** for key terms, formulas, and critical concepts.
- Use ## headers to organize long answers. Include real-world examples.
- Encourage and motivate students.

FORMATTING: Use markdown. **Bold** every important term. Use numbered steps for processes. Use tables for comparisons.${profile ? buildPersonalizationSection(profile) : ""}`;

  if (mode === "topper") {
    return base + `

TOPPER MODE — ULTRA DETAILED ANSWERS:
Give a comprehensive, exam-ready answer covering ALL of the following:
## 1. Definition & Overview
## 2. Detailed Explanation (step-by-step mechanism/theory)
## 3. Key Formulas / Models (if applicable)
## 4. Real-World Applications (minimum 3 examples)
## 5. Common Mistakes & Misconceptions
## 6. Memory Trick / Mnemonic
## 7. Related Concepts
## 8. Possible Exam Questions on this Topic

End EVERY answer with:
**📋 Quick Revision Summary:**
• [5-7 bullet points covering the most important points]`;
  }

  return base;
}

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

  const systemMessage = {
    role: "system" as const,
    content: buildSystemPrompt(mode, userProfile),
  };

  const messages = parsed.data.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  let apiMessages: Parameters<typeof groq.chat.completions.create>[0]["messages"];

  if (hasImage && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    const withoutLast = messages.slice(0, -1);
    apiMessages = [
      systemMessage,
      ...withoutLast,
      {
        role: "user" as const,
        content: [
          { type: "image_url" as const, image_url: { url: imageData as string } },
          { type: "text" as const, text: lastMsg.content || "What is in this image? Explain it in an educational context." },
        ],
      },
    ];
  } else {
    apiMessages = [systemMessage, ...messages];
  }

  const model = hasImage ? VISION_MODEL : GROQ_MODEL;

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: apiMessages,
      max_tokens: mode === "topper" ? 4096 : 2048,
    });
    const content = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
    res.json({ content });
  } catch (err: unknown) {
    logger.error({ err }, "Groq AI chat error");
    // If vision model fails, retry with text-only using just the text content
    if (hasImage) {
      try {
        const textOnlyMessages = [
          systemMessage,
          ...messages.slice(0, -1),
          {
            role: "user" as const,
            content: messages[messages.length - 1]?.content || "Please help me with this.",
          },
        ];
        const fallback = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: textOnlyMessages,
          max_tokens: 2048,
        });
        const content = fallback.choices[0]?.message?.content ?? "I couldn't process the image. Please describe your question in text.";
        res.json({ content });
        return;
      } catch {
        res.status(500).json({ error: "Failed to process the image. Please try typing your question instead." });
        return;
      }
    }
    res.status(500).json({ error: "Failed to generate a response. Please try again." });
  }
});

router.post("/ai/summarize", async (req, res): Promise<void> => {
  const parsed = AiSummarizeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
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

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
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
  totalChunks: number
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

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: Math.min(8192, count * 150 + 200),
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
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

  const { difficulty, type } = parsed.data;
  let { topic, count } = parsed.data;

  topic = topic.replace(/\[variation-seed:[^\]]+\]/g, "").trim();
  count = Math.max(1, Math.min(100, count));

  const questionType =
    type === "multiple-choice" || type === "Multiple Choice"
      ? "multiple choice (4 options A/B/C/D)"
      : type === "true-false" || type === "True/False" || type === "True-False"
      ? "true/false (options: True or False only)"
      : "mixed (some multiple choice with 4 options, some true/false)";

  const CHUNK_SIZE = 30;
  const allQuestions: QuizQuestion[] = [];
  const totalChunks = Math.ceil(count / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const remaining = count - allQuestions.length;
    if (remaining <= 0) break;
    const chunkCount = Math.min(CHUNK_SIZE, remaining);
    const questions = await generateQuizChunk(topic, chunkCount, difficulty, questionType, i + 1, totalChunks);
    allQuestions.push(...questions);
  }

  res.json({ questions: allQuestions });
});

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

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let result: { cards: unknown[] };
  try {
    result = JSON.parse(raw);
  } catch {
    logger.error({ raw }, "Failed to parse flashcards response");
    result = { cards: [] };
  }

  res.json({ cards: Array.isArray(result.cards) ? result.cards : [] });
});

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

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "user",
        content: `${instruction}\n\nNotes:\n"""\n${content}\n"""`,
      },
    ],
    max_tokens: 2048,
  });

  const enhanced = completion.choices[0]?.message?.content ?? content;
  res.json({ content: enhanced });
});

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

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let result: { questions: unknown[] };
  try {
    result = JSON.parse(raw);
  } catch {
    result = { questions: [] };
  }

  res.json({ questions: Array.isArray(result.questions) ? result.questions : [] });
});

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

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
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
