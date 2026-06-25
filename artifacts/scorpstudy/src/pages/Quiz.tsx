import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Loader2, Save, RefreshCw, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useSaveQuizResult } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const QUESTION_COUNTS = ["15", "30", "50"];

const QUESTION_TYPES = [
  { value: "Multiple Choice",       label: "Multiple Choice" },
  { value: "True-False",            label: "True / False" },
  { value: "Mixed",                 label: "Mixed" },
  { value: "Very Short Question",   label: "Very Short Question" },
  { value: "Short Question",        label: "Short Question" },
  { value: "Long Question",         label: "Long Question" },
  { value: "Very Long Question",    label: "Very Long Question" },
  { value: "Exam-Focused Question", label: "Exam-Focused Question" },
  { value: "Tricky Question",       label: "Tricky Question" },
];

export default function Quiz() {
  const { user } = useAuth();
  const [topic, setTopic]       = useState("");
  const [count, setCount]       = useState("15");
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType]         = useState("Multiple Choice");
  const [isGenerating, setIsGenerating] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers]     = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore]         = useState(0);

  const saveQuiz = useSaveQuizResult();

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    setQuestions([]);
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setIsGenerating(true);

    try {
      const seed = Date.now();
      const res = await fetch(`${BASE}/api/ai/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${topic} [variation-seed:${seed}]`,
          count: parseInt(count),
          difficulty,
          type,
          ...(user?.id ? { userId: user.id } : {}),
        }),
      });

      if (res.status === 429) {
        const d = await res.json();
        toast.error(d.message ?? "You have crossed today's free quota limit. Try again tomorrow.", { duration: 6000 });
        return;
      }
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      const qs = data.questions as QuizQuestion[];
      setQuestions(qs);
      toast.success(`${qs.length} questions generated!`);
    } catch {
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) s++; });
    setScore(s);
    setIsSubmitted(true);
    try {
      await saveQuiz.mutateAsync({ data: { topic, score: s, total: questions.length, questions } });
      toast.success("Quiz results saved!");
    } catch { /* silent */ }
  };

  const pct   = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-violet-600" />
            Quiz Generator
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Test your knowledge with unique AI-generated quizzes — no repeated questions.</p>
        </div>

        {!questions.length ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Create a New Quiz</CardTitle>
              <CardDescription>Configure your quiz parameters below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Cellular Respiration, World War II, React Hooks"
                  value={topic} onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Number of Questions — only 15 / 30 / 50 */}
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_COUNTS.map((n) => (
                        <SelectItem key={n} value={n}>{n} Questions</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Type */}
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Type hint */}
              {["Long Question", "Very Long Question"].includes(type) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2">
                  ⚠️ Long-form questions may take 30–60 seconds to generate.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700">
                {isGenerating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating {count} Questions...</>
                  : <><CheckSquare className="w-4 h-4 mr-2" />Generate Quiz</>}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="bg-violet-50 border-violet-100">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-violet-900">{topic}</h2>
                  <p className="text-violet-700 text-sm">{questions.length} questions • {difficulty} • {type}</p>
                </div>
                {isSubmitted && (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-black text-violet-700">{score}/{questions.length}</div>
                      <div className="text-sm font-medium text-violet-600">{pct}% — Grade {grade}</div>
                    </div>
                    <Trophy className={`w-8 h-8 ${pct >= 70 ? "text-yellow-500" : "text-slate-300"}`} />
                  </div>
                )}
                {!isSubmitted && (
                  <div className="text-sm text-violet-700 font-medium">
                    {Object.keys(answers).length}/{questions.length} answered
                  </div>
                )}
              </CardContent>
            </Card>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className={`border-slate-200 transition-colors ${
                isSubmitted
                  ? answers[qIndex] === q.correctAnswer
                    ? "border-green-300 bg-green-50/40"
                    : "border-red-300 bg-red-50/40"
                  : ""
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base leading-relaxed flex gap-2 font-medium">
                    <span className="text-violet-500 font-bold shrink-0">{qIndex + 1}.</span>
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={answers[qIndex] || ""}
                    onValueChange={(val) => !isSubmitted && setAnswers(prev => ({ ...prev, [qIndex]: val }))}
                    className="space-y-2">
                    {q.options.map((opt, oIndex) => {
                      let cls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm";
                      let icon = null;
                      if (!isSubmitted) {
                        cls += answers[qIndex] === opt
                          ? " border-violet-500 bg-violet-50 text-violet-900"
                          : " border-slate-200 hover:bg-slate-50";
                      } else {
                        if (opt === q.correctAnswer) {
                          cls += " border-green-500 bg-green-100 text-green-900";
                          icon = <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0" />;
                        } else if (answers[qIndex] === opt) {
                          cls += " border-red-500 bg-red-100 text-red-900";
                          icon = <XCircle className="w-4 h-4 text-red-600 ml-auto shrink-0" />;
                        } else {
                          cls += " border-slate-200 opacity-50";
                        }
                      }
                      return (
                        <Label key={oIndex} className={cls}>
                          <RadioGroupItem value={opt} id={`q${qIndex}-o${oIndex}`}
                            disabled={isSubmitted} className={isSubmitted ? "sr-only" : ""} />
                          <span className="flex-1 font-medium">{opt}</span>
                          {icon}
                        </Label>
                      );
                    })}
                  </RadioGroup>
                  {isSubmitted && q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-sm">
                      <span className="font-semibold text-slate-700">💡 Explanation: </span>
                      <span className="text-slate-600">{q.explanation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-wrap justify-between gap-3 pb-6">
              <Button variant="outline" onClick={() => setQuestions([])} className="gap-2">
                <RotateCcw className="w-4 h-4" /> New Quiz
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Different Questions
                </Button>
                {!isSubmitted && (
                  <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700 px-8 gap-2"
                    disabled={saveQuiz.isPending}>
                    {saveQuiz.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
