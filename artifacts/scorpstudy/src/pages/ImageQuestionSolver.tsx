import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X, Camera, Sparkles, Copy, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export default function ImageQuestionSolver() {
  const [image, setImage] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImage({ name: file.name, url: reader.result as string, mimeType: file.type });
    reader.readAsDataURL(file);
    setAnswer("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSolve = async () => {
    if (!image) { toast.error("Please upload an image first"); return; }
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch(`${BASE}/api/ai/image-solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: image.url,
          question: customQuestion.trim() || "Carefully analyze this image. Find and answer every question visible. Show all working and steps clearly.",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAnswer(data.content || "No response received.");
      toast.success("Questions solved!");
    } catch {
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImage(null); setAnswer(""); setCustomQuestion(""); };
  const copy = () => { navigator.clipboard.writeText(answer); toast.success("Copied to clipboard!"); };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-sm">
                <Camera className="w-5 h-5 text-white" />
              </div>
              Image Question Solver
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Upload a photo of any question paper, textbook, or worksheet — AI will solve every question with full step-by-step working.
            </p>
          </div>
          {(image || answer) && (
            <Button variant="outline" size="sm" onClick={reset} className="shrink-0 gap-1.5 text-slate-600">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-fuchsia-500 shrink-0 mt-0.5" />
          <p className="text-sm text-fuchsia-800">
            Works with handwritten notes, printed exams, math problems, diagrams, chemistry equations — any academic content.
            Upload clearly-lit images for best results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Upload + settings */}
          <div className="space-y-4">
            {/* Drop zone */}
            {!image ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 h-64 border-2 border-dashed border-fuchsia-200 rounded-2xl bg-fuchsia-50/50 cursor-pointer hover:bg-fuchsia-50 hover:border-fuchsia-400 transition-colors text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-100 to-violet-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-fuchsia-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Click or drag to upload</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG, WEBP — up to 10MB</p>
                </div>
                <Button size="sm" variant="outline" className="border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50 pointer-events-none">
                  Choose Image
                </Button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-fuchsia-200 shadow-sm bg-white">
                <img src={image.url} alt="Uploaded" className="w-full max-h-64 object-contain bg-slate-50" />
                <button onClick={() => { setImage(null); setAnswer(""); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow">
                  <X className="w-4 h-4" />
                </button>
                <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-xs text-slate-600 truncate font-medium">{image.name}</p>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

            {/* Optional custom question */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Custom instruction (optional)
              </label>
              <textarea
                value={customQuestion}
                onChange={e => setCustomQuestion(e.target.value)}
                placeholder='E.g. "Only solve question 3" or "Explain each step in detail"'
                className="w-full h-20 text-sm rounded-xl border border-slate-200 p-3 resize-none outline-none focus:ring-2 focus:ring-fuchsia-300 bg-slate-50"
              />
            </div>

            {/* Solve button */}
            <Button
              onClick={handleSolve}
              disabled={!image || loading}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-fuchsia-500 to-violet-600 hover:from-fuchsia-600 hover:to-violet-700 gap-2 shadow-lg shadow-fuchsia-200"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Solving...</>
                : <><Sparkles className="w-5 h-5" /> Solve Questions</>
              }
            </Button>

            {/* Tips */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">📌 Tips for best results</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                {[
                  "Good lighting — avoid shadows over the text",
                  "Hold camera straight — avoid angles",
                  "All text must be clearly readable",
                  "Works with any language",
                  "Supports handwritten and printed text",
                ].map((tip, i) => <li key={i} className="flex gap-2"><span className="text-green-500 shrink-0">✓</span>{tip}</li>)}
              </ul>
            </div>
          </div>

          {/* Right: Answer */}
          <div>
            <Card className="border-slate-200 shadow-sm h-full min-h-64">
              <CardContent className="p-0 h-full">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full p-12 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700">Analyzing your image...</p>
                      <p className="text-sm text-slate-400 mt-1">Reading questions and solving step by step</p>
                    </div>
                  </div>
                ) : answer ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-fuchsia-50 to-violet-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-slate-700">Solution</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={copy} className="gap-1 text-slate-500 h-7 text-xs">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                      <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-12 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">Solutions appear here</p>
                      <p className="text-sm text-slate-400 mt-1">Upload an image and click "Solve Questions"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
