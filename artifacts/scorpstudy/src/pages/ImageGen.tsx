import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSaveImage } from "@workspace/api-client-react";
import { ImageIcon, Loader2, Save, Download, RefreshCw, Wand2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const IMAGE_DAILY_LIMIT = 3;

function getTodayKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `scorpstudy_img_${userId}_${today}`;
}

function getImagesUsedToday(userId: string): number {
  if (!userId) return 0;
  return parseInt(localStorage.getItem(getTodayKey(userId)) ?? "0", 10);
}

function incrementImagesUsed(userId: string) {
  if (!userId) return;
  const key = getTodayKey(userId);
  const cur = parseInt(localStorage.getItem(key) ?? "0", 10);
  localStorage.setItem(key, String(cur + 1));
}

const STYLES: Record<string, { suffix: string; label: string }> = {
  Educational: { suffix: "educational illustration, labeled diagram, clean white background, university textbook style, accurate, detailed", label: "📚 Educational" },
  Realistic:   { suffix: "photorealistic, highly detailed, sharp focus, 8k, professional photography", label: "📷 Realistic" },
  Diagram:     { suffix: "scientific diagram, labeled components, clean background, technical illustration, precise", label: "📊 Diagram" },
  Cartoon:     { suffix: "colorful cartoon style, flat design, friendly, educational, bright colors", label: "🎨 Cartoon" },
  Blueprint:   { suffix: "technical blueprint, white lines on dark blue, engineering drawing, labeled, precise", label: "🔵 Blueprint" },
  Historical:  { suffix: "historical illustration, detailed, period accurate, oil painting style, dramatic", label: "🏛️ Historical" },
};

const SUGGESTIONS = [
  "Human heart anatomy with labeled chambers",
  "Plant cell structure diagram",
  "Solar system to scale",
  "Mitosis stages step by step",
  "Roman Colosseum in its prime",
  "Newton's laws of motion illustrated",
  "Water cycle diagram",
  "DNA double helix structure",
];

async function enhancePrompt(rawPrompt: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `You are an expert at writing image generation prompts for educational content. Take this simple prompt and make it highly descriptive, specific, and accurate for generating a high-quality educational image.

Simple prompt: "${rawPrompt}"

Write ONE optimized prompt (2-3 sentences max, no explanations). Include: specific visual details, educational context, style cues, and what should be labeled/highlighted. Output only the optimized prompt text.`
        }]
      }),
    });
    if (!res.ok) return rawPrompt;
    const data = await res.json();
    return (data.content as string).trim() || rawPrompt;
  } catch {
    return rawPrompt;
  }
}

function buildUrl(enhancedPrompt: string, style: string) {
  const styleSuffix = STYLES[style]?.suffix ?? STYLES.Educational.suffix;
  const fullPrompt  = `${enhancedPrompt}, ${styleSuffix}`;
  const seed = Math.floor(Math.random() * 9999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=768&nologo=true&seed=${seed}&model=flux`;
}

export default function ImageGen() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [prompt, setPrompt]           = useState("");
  const [style, setStyle]             = useState("Educational");
  const [imageUrl, setImageUrl]       = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing]   = useState(false);
  const [imageLoaded, setImageLoaded]   = useState(false);
  const [currentPrompt, setCurrentPrompt]     = useState("");
  const [enhancedPrompt, setEnhancedPrompt]   = useState("");

  const saveImage = useSaveImage();

  const usedToday = getImagesUsedToday(userId);
  const remaining = Math.max(0, IMAGE_DAILY_LIMIT - usedToday);
  const limitReached = usedToday >= IMAGE_DAILY_LIMIT;

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }

    if (limitReached) {
      toast.error(
        `You have reached your daily limit of ${IMAGE_DAILY_LIMIT} images. Your limit resets at midnight. Come back tomorrow!`,
        { duration: 6000, icon: "🚫" }
      );
      return;
    }

    setIsGenerating(true);
    setIsEnhancing(true);
    setImageLoaded(false);
    setCurrentPrompt(prompt.trim());

    const enhanced = await enhancePrompt(prompt.trim());
    setEnhancedPrompt(enhanced);
    setIsEnhancing(false);

    const url = buildUrl(enhanced, style);
    setImageUrl(url);
    incrementImagesUsed(userId);
  };

  const handleRetry = () => {
    if (!currentPrompt) return;
    if (limitReached) {
      toast.error(`Daily limit of ${IMAGE_DAILY_LIMIT} images reached. Try again tomorrow.`, { duration: 5000 });
      return;
    }
    setIsGenerating(true);
    setImageLoaded(false);
    const url = buildUrl(enhancedPrompt || currentPrompt, style);
    setImageUrl(url);
    incrementImagesUsed(userId);
  };

  const handleSave = async () => {
    if (!imageUrl || !imageLoaded) return;
    try {
      await saveImage.mutateAsync({ data: { prompt: currentPrompt, imageUrl, style } });
      toast.success("Image saved!");
    } catch { toast.error("Failed to save image"); }
  };

  const handleDownload = async () => {
    if (!imageUrl || !imageLoaded) return;
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `scorpstudy-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-fuchsia-600" />
              Image Generator
            </h1>
            <p className="text-slate-500 mt-1 text-sm">AI-enhanced educational visuals — prompt gets automatically improved before generating.</p>
          </div>
          {/* Daily limit badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            limitReached
              ? "bg-red-50 border-red-200 text-red-700"
              : remaining <= 1
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700"
          }`}>
            <ImageIcon className="w-3.5 h-3.5" />
            {limitReached ? "Daily limit reached" : `${remaining} image${remaining !== 1 ? "s" : ""} left today`}
          </div>
        </div>

        {/* Limit reached warning */}
        {limitReached && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>Daily image limit reached ({IMAGE_DAILY_LIMIT}/day).</strong>
              <p className="text-xs mt-0.5">To keep the service free and fast for all students, each user can generate up to {IMAGE_DAILY_LIMIT} images per day. Your quota resets at midnight.</p>
            </div>
          </div>
        )}

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Describe what you want to visualize... e.g. 'human heart with labeled chambers', 'solar system diagram'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none text-sm min-h-[80px] bg-slate-50"
                disabled={limitReached}
              />
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setPrompt(s)} disabled={limitReached}
                    className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-fuchsia-400 hover:text-fuchsia-700 hover:bg-fuchsia-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {Object.entries(STYLES).map(([key, val]) => (
                  <button key={key} onClick={() => setStyle(key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${style === key ? "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800 font-semibold" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {val.label}
                  </button>
                ))}
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim() || limitReached}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 gap-2 shrink-0">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isGenerating ? (isEnhancing ? "Enhancing prompt…" : "Generating…") : "Generate Image"}
              </Button>
            </div>

            {isEnhancing && (
              <div className="flex items-center gap-2 text-xs text-fuchsia-600 bg-fuchsia-50 rounded-lg px-3 py-2 border border-fuchsia-100">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI is enhancing your prompt for better results…
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
          {!imageUrl ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <ImageIcon className="w-16 h-16 mb-4 text-slate-200" />
              <h3 className="text-base font-semibold text-slate-600 mb-2">No image yet</h3>
              <p className="text-sm max-w-sm">Enter a description and click Generate. Your prompt will be automatically enhanced by AI for best results.</p>
            </div>
          ) : (
            <>
              <div className="relative bg-slate-100 flex-1 flex items-center justify-center p-4 min-h-[360px]">
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-fuchsia-500" />
                    <p className="text-slate-600 font-semibold">Generating your image…</p>
                    <p className="text-slate-400 text-sm mt-1">Powered by AI • Takes ~15 seconds</p>
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={currentPrompt}
                  className={`max-w-full max-h-[500px] object-contain rounded-lg shadow transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => { setIsGenerating(false); setImageLoaded(true); }}
                  onError={() => { setIsGenerating(false); setImageLoaded(false); toast.error("Generation failed. Please retry."); }}
                />
              </div>
              <div className="p-4 border-t border-slate-100 bg-white space-y-2">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">Original prompt:</p>
                    <p className="text-sm text-slate-700 truncate">"{currentPrompt}"</p>
                    {enhancedPrompt && enhancedPrompt !== currentPrompt && (
                      <>
                        <p className="text-xs font-semibold text-fuchsia-500 mt-1 mb-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI-enhanced:</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{enhancedPrompt}</p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={handleRetry} disabled={isGenerating || limitReached} className="gap-1.5 text-xs">
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating || !imageLoaded} className="gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isGenerating || !imageLoaded || saveImage.isPending} className="bg-fuchsia-600 hover:bg-fuchsia-700 gap-1.5 text-xs">
                      {saveImage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save
                    </Button>
                  </div>
                </div>
                {imageLoaded && (
                  <Badge variant="secondary" className="text-[10px]">Style: {STYLES[style]?.label ?? style}</Badge>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
