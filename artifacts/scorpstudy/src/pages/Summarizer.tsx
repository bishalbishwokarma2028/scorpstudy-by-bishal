import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAiSummarize, useSaveSummary, useListSummaries } from "@workspace/api-client-react";
import { FileText, Loader2, Save, Download, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  examQuestions: string[];
}

export default function Summarizer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  
  const summarizeAi = useAiSummarize();
  const saveSummary = useSaveSummary();
  const { refetch: refetchSummaries } = useListSummaries();

  const handleSummarize = async () => {
    if (!text.trim() || text.length < 50) {
      toast.error("Please enter at least 50 characters to summarize");
      return;
    }
    
    try {
      const response = await summarizeAi.mutateAsync({ data: { text } });
      setResult(response);
      toast.success("Summary generated");
    } catch (error) {
      toast.error("Failed to generate summary");
    }
  };

  const handleSave = async () => {
    if (!result) return;
    
    try {
      await saveSummary.mutateAsync({ 
        data: { 
          originalText: text.substring(0, 500), // Save first 500 chars as reference
          summary: result.summary,
          keyPoints: result.keyPoints,
          examQuestions: result.examQuestions
        } 
      });
      toast.success("Summary saved");
      refetchSummaries();
    } catch (error) {
      toast.error("Failed to save summary");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const content = `
SUMMARY
=================
${result.summary}

KEY POINTS
=================
${result.keyPoints.map(p => `- ${p}`).join('\n')}

EXAM QUESTIONS
=================
${result.examQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
    `.trim();
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            PDF & Notes Summarizer
          </h1>
          <p className="text-slate-500 mt-1">Paste long text to extract key points and generate practice questions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Original Text</CardTitle>
              <CardDescription>Paste your notes, PDF content, or article here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text here... (min 50 characters)"
                className="min-h-[400px] resize-none bg-slate-50 border-slate-200"
              />
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  {text.length} characters
                </span>
                <Button onClick={handleSummarize} disabled={summarizeAi.isPending || text.length < 50} className="bg-indigo-600 hover:bg-indigo-700">
                  {summarizeAi.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Summarize
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Result</CardTitle>
                <CardDescription>AI-generated analysis.</CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleCopy(result.summary)} title="Copy summary">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleDownload} title="Download text">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleSave} disabled={saveSummary.isPending} title="Save to history">
                    {saveSummary.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {result ? (
                <div className="space-y-6 h-[450px] overflow-y-auto pr-2">
                  <div>
                    <h3 className="text-md font-bold text-slate-800 mb-2 sticky top-0 bg-white py-1">Executive Summary</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">{result.summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-bold text-slate-800 mb-2 sticky top-0 bg-white py-1">Key Points</h3>
                    <ul className="space-y-2">
                      {result.keyPoints.map((point, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-slate-800 mb-2 sticky top-0 bg-white py-1">Possible Exam Questions</h3>
                    <div className="space-y-3">
                      {result.examQuestions.map((q, i) => (
                        <div key={i} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50 text-sm text-indigo-900 font-medium">
                          <span className="text-indigo-400 mr-2">Q{i+1}.</span> {q}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center text-slate-400 max-w-sm">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p>Paste your text and click summarize to see the magic happen.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
