import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAiSummarize, useSaveSummary } from "@workspace/api-client-react";
import { FileText, Loader2, Save, Download, Copy, Sparkles, BookOpen, HelpCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  examQuestions: string[];
}

export default function Summarizer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [saved, setSaved] = useState(false);

  const summarizeAi = useAiSummarize();
  const saveSummary = useSaveSummary();

  const handleSummarize = async () => {
    if (!text.trim() || text.length < 50) {
      toast.error("Please enter at least 50 characters to summarize");
      return;
    }
    setSaved(false);
    try {
      const response = await summarizeAi.mutateAsync({ data: { text } });
      setResult(response as SummaryResult);
    } catch {
      toast.error("Failed to generate summary. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await saveSummary.mutateAsync({
        data: { originalText: text.substring(0, 500), summary: result.summary, keyPoints: result.keyPoints, examQuestions: result.examQuestions }
      });
      toast.success("Summary saved to history!");
      setSaved(true);
    } catch {
      toast.error("Failed to save summary");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `SCORPSTUDY BY BISHAL — AI SUMMARY\n${"=".repeat(40)}\n\n📝 EXECUTIVE SUMMARY\n${result.summary}\n\n✅ KEY POINTS\n${result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n❓ EXAM QUESTIONS\n${result.examQuestions.map((q, i) => `Q${i + 1}: ${q}`).join("\n")}`.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            PDF & Notes Summarizer
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Paste any text — lecture notes, article, chapter — and get an instant AI-powered study breakdown.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Input */}
          <Card className="border-slate-200 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" />Your Text</CardTitle>
              <CardDescription className="text-xs">Paste notes, PDF content, article, or textbook chapter.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here... (minimum 50 characters)"
                className="flex-1 min-h-[320px] resize-none bg-slate-50 border-slate-200 text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{charCount} chars</span>
                  <span>{wordCount} words</span>
                  {charCount >= 50 && <span className="text-green-600 font-medium">✓ Ready</span>}
                </div>
                <Button onClick={handleSummarize} disabled={summarizeAi.isPending || charCount < 50} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  {summarizeAi.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Summarize</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="border-slate-200 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">AI Analysis</CardTitle>
                  <CardDescription className="text-xs">Summary, key points, and exam questions.</CardDescription>
                </div>
                {result && (
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleCopy(`${result.summary}\n\nKey Points:\n${result.keyPoints.join("\n")}`)} title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleDownload} title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleSave} disabled={saveSummary.isPending || saved} title="Save">
                      {saved ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : saveSummary.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {summarizeAi.isPending ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                  <p className="text-slate-500 font-medium">Analyzing your text...</p>
                  <p className="text-slate-400 text-xs">This may take a few seconds</p>
                </div>
              ) : result ? (
                <div className="space-y-5 h-[360px] overflow-y-auto pr-1">
                  {/* Summary */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-800">Executive Summary</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 p-3 rounded-lg border border-indigo-100">{result.summary}</p>
                  </div>

                  {/* Key Points */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <h3 className="text-sm font-bold text-slate-800">Key Points</h3>
                      <Badge variant="secondary" className="text-[10px] h-4">{result.keyPoints.length}</Badge>
                    </div>
                    <ul className="space-y-2">
                      {result.keyPoints.map((point, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-slate-700 items-start">
                          <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exam Questions */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4 text-orange-500" />
                      <h3 className="text-sm font-bold text-slate-800">Possible Exam Questions</h3>
                      <Badge variant="secondary" className="text-[10px] h-4">{result.examQuestions.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {result.examQuestions.map((q, i) => (
                        <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-sm">
                          <span className="text-orange-500 font-bold mr-2">Q{i + 1}.</span>
                          <span className="text-slate-800">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <FileText className="w-14 h-14 mb-3 text-slate-200" />
                  <p className="text-slate-500 font-medium">No analysis yet</p>
                  <p className="text-sm max-w-xs mt-1">Paste your text on the left and click Summarize to get a full breakdown.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
