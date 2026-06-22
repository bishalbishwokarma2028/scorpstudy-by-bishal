import { Router, type IRouter } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";
import {
  AiChatBody,
  AiSummarizeBody,
  AiGenerateQuizBody,
  AiGenerateFlashcardsBody,
  AiEnhanceNotesBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const messages = parsed.data.messages.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const systemMessage = {
    role: "system" as const,
    content:
      "You are ScorpStudy AI, an expert study tutor for college students. You explain concepts clearly, help students understand difficult topics, provide examples, and guide learning. Be encouraging, accurate, and educational. Format your responses with markdown when helpful.",
  };

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [systemMessage, ...messages],
    max_tokens: 2048,
  });

  const content = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
  res.json({ content });
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

router.post("/ai/quiz", async (req, res): Promise<void> => {
  const parsed = AiGenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, count, difficulty, type } = parsed.data;

  const questionType =
    type === "multiple-choice" || type === "Multiple Choice"
      ? "multiple choice (4 options)"
      : type === "true-false" || type === "True/False"
      ? "true/false"
      : "mixed (some multiple choice with 4 options, some true/false)";

  const prompt = `Generate ${count} ${difficulty} difficulty ${questionType} quiz questions about: ${topic}

Respond in this exact JSON format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "..."
    }
  ]
}

For true/false questions, options should be ["True", "False"] and correctAnswer should be "True" or "False".`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let result: { questions: unknown[] };
  try {
    result = JSON.parse(raw);
  } catch {
    logger.error({ raw }, "Failed to parse quiz response");
    result = { questions: [] };
  }

  res.json({ questions: Array.isArray(result.questions) ? result.questions : [] });
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

export default router;
