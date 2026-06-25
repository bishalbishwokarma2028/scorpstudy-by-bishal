import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSaveSummary } from "@workspace/api-client-react";
import { FileText, Loader2, Save, Download, Copy, Sparkles, BookOpen, HelpCircle, CheckCircle, Paperclip, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  examQuestions: string[];
}

const AUDIO_TYPES = ["audio/", "video/"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: { str?: string }) => it.str ?? "").join(" ") + "\n";
  }
  return text.trim().slice(0, 12000);
}

async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromImage(base64: string, userId?: string): Promise<string> {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Please read and transcribe ALL text content from this image. If there are diagrams or charts, describe them in full detail. Extract everything that would be useful for summarization." }],
      image_data: base64,
      mode: "standard",
      ...(userId ? { userId } : {}),
    }),
  });
  if (!res.ok) throw new Error("Vision extraction failed");
  const d = await res.json();
  return (d.content as string) ?? "";
}

export default function Summarizer() {
  const { user } = useAuth();
  const [text, setText]         = useState("");
  const [result, setResult]     = useState<SummaryResult | null>(null);
  const [saved, setSaved]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveSummary = useSaveSummary();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    e.target.value = "";
    if (!file) return;

    const mime = file.type.toLowerCase();

    // ── Block audio & video ──────────────────────────────────────────────
    if (AUDIO_TYPES.some((t) => mime.startsWith(t))) {
      toast.error(
        "Audio and video files are not supported. Please upload a PDF, image, or text document.",
        { duration: 5000, icon: "🚫" }
      );
      return;
    }

    // ── Block images > 2 MB ──────────────────────────────────────────────
    if (mime.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
      toast.error(
        `Images larger than 2 MB are not allowed (your file: ${(file.size / 1024 / 1024).toFixed(1)} MB). Please compress the image or paste the text directly.`,
        { duration: 6000, icon: "📏" }
      );
      return;
    }

    setIsLoading(true);
    setAttachedFileName(file.name);
    try {
      let extracted = "";

      if (mime === "application/pdf") {
        toast.info("Reading PDF…");
        extracted = await extractPdfText(file);
        if (!extracted.trim()) throw new Error("No readable text found in PDF.");
      } else if (mime.startsWith("image/")) {
        toast.info("Analysing image with AI…");
        const b64 = await imageToBase64(file);
        extracted = await extractTextFromImage(b64, user?.id);
      } else {
        // .txt, .md, .csv, .doc (best-effort)
        extracted = await file.text();
        extracted = extracted.slice(0, 12000);
      }

      setText(extracted);
      toast.success(`File loaded: ${file.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read file. Try copying the text manually.");
      setAttachedFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!text.trim() || text.length < 50) {
      toast.error("Please enter at least 50 characters to summarize");
      return;
    }
    setSaved(false);
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/ai/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
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
      setResult(data as SummaryResult);
    } catch {
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
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
    } catch { toast.error("Failed to save summary"); }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `SCORPSTUDY BY BISHAL — AI SUMMARY\n${"=".repeat(40)}\n\n📝 EXECUTIVE SUMMARY\n${result.summary}\n\n✅ KEY POINTS\n${result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n❓ EXAM QUESTIONS\n${result.examQuestions.map((q, i) => `Q${i + 1}: ${q}`).join("\n")}`.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `summary-${Date.now()}.txt`; a.click();
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
          <p className="text-slate-500 mt-1 text-sm">Paste text or upload a file — PDF, image, or document — for an instant AI-powered study breakdown.</p>
        </div>

        {/* File type restriction notice */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>Allowed:</strong> PDF, images (JPG/PNG/etc. under 2 MB), text files (.txt, .md, .csv)&nbsp;&nbsp;
            <strong>Not allowed:</strong> Audio files, video files, images over 2 MB
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md,.csv,.doc,.docx,image/*"
          onChange={handleFileSelect}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Input */}
          <Card className="border-slate-200 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" />Your Text</CardTitle>
              <CardDescription className="text-xs">Paste text, or click the upload button to load a file.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              {/* Upload bar */}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-8"
                  onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                  <Paperclip className="w-3.5 h-3.5" />
                  {attachedFileName ? "Change File" : "Upload File"}
                </Button>
                {attachedFileName && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1">
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{attachedFileName}</span>
                    <button onClick={() => { setAttachedFileName(null); setText(""); }} className="ml-0.5 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here, or upload a file above... (minimum 50 characters)"
                className="flex-1 min-h-[280px] resize-none bg-slate-50 border-slate-200 text-sm leading-relaxed"
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{charCount} chars</span>
                  <span>{wordCount} words</span>
                  {charCount >= 50 && <span className="text-green-600 font-medium">✓ Ready</span>}
                </div>
                <Button onClick={handleSummarize} disabled={isLoading || charCount < 50}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing...</>
                    : <><Sparkles className="w-4 h-4" />Summarize</>}
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
                    <Button variant="outline" size="sm" className="h-8 px-2"
                      onClick={() => handleCopy(`${result.summary}\n\nKey Points:\n${result.keyPoints.join("\n")}`)} title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleDownload} title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2"
                      onClick={handleSave} disabled={saveSummary.isPending || saved} title="Save">
                      {saved ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> :
                       saveSummary.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                       <Save className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                  <p className="text-slate-500 font-medium">Analysing your content…</p>
                  <p className="text-slate-400 text-xs">This may take a few seconds</p>
                </div>
              ) : result ? (
                <div className="space-y-5 h-[360px] overflow-y-auto pr-1">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-800">Executive Summary</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 p-3 rounded-lg border border-indigo-100">{result.summary}</p>
                  </div>
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
                  <p className="text-sm max-w-xs mt-1">Paste text or upload a file, then click Summarize.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
