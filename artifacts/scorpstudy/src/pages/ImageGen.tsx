import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveImage } from "@workspace/api-client-react";
import { ImageIcon, Loader2, Save, Download, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";

const STYLE_PROMPTS: Record<string, string> = {
  Realistic: "photorealistic, highly detailed, sharp focus",
  Diagram: "scientific diagram, labeled, clean white background, educational illustration",
  Cartoon: "colorful cartoon style, flat design, friendly, educational",
  Artistic: "artistic, vibrant colors, creative illustration",
  Blueprint: "technical blueprint, white lines on dark blue background, engineering drawing",
};

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Realistic");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const saveImage = useSaveImage();

  const buildUrl = (p: string, s: string) => {
    const enhancedPrompt = `${p}, ${STYLE_PROMPTS[s] ?? s}, high quality`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const seed = Math.floor(Math.random() * 9999999);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}&model=flux`;
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsGenerating(true);
    setImageLoaded(false);
    setCurrentPrompt(prompt.trim());
    const url = buildUrl(prompt.trim(), style);
    setImageUrl(url);
  };

  const handleRetry = () => {
    if (!currentPrompt) return;
    setIsGenerating(true);
    setImageLoaded(false);
    const url = buildUrl(currentPrompt, style);
    setImageUrl(url);
  };

  const handleImageLoad = () => {
    setIsGenerating(false);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setIsGenerating(false);
    setImageLoaded(false);
    toast.error("Failed to generate image. Please try again.");
  };

  const handleSave = async () => {
    if (!imageUrl || !imageLoaded) return;
    try {
      await saveImage.mutateAsync({ data: { prompt: currentPrompt, imageUrl, style } });
      toast.success("Image saved to history");
    } catch {
      toast.error("Failed to save image");
    }
  };

  const handleDownload = async () => {
    if (!imageUrl || !imageLoaded) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scorpstudy-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download image");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-fuchsia-600" />
            Image Generator
          </h1>
          <p className="text-slate-500 mt-1">Visualize complex concepts, anatomy, diagrams, or historical events with AI.</p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-3 flex-col md:flex-row">
              <Input
                placeholder="e.g. diagram of a plant cell, Roman empire map, human heart anatomy..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="h-12 text-base flex-1"
              />
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="h-12 w-full md:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STYLE_PROMPTS).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="h-12 px-6 bg-fuchsia-600 hover:bg-fuchsia-700 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" />Generate</>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400">Tip: Be specific for better results — mention the subject, style, and purpose.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 overflow-hidden min-h-[420px] flex flex-col">
          {!imageUrl ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <ImageIcon className="w-16 h-16 mb-4 text-slate-200" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No image generated yet</h3>
              <p className="max-w-sm">Enter a prompt above and click Generate to visualize your study materials.</p>
            </div>
          ) : (
            <>
              <div className="relative bg-slate-100 flex-1 flex items-center justify-center p-4 min-h-[360px]">
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-fuchsia-500" />
                    <p className="text-slate-500 font-medium">Generating your image...</p>
                    <p className="text-slate-400 text-sm mt-1">This may take 10–20 seconds</p>
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={currentPrompt}
                  className={`max-w-full max-h-[500px] object-contain rounded-lg shadow-sm transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
              <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center gap-3 flex-wrap">
                <p className="text-sm text-slate-500 font-medium truncate max-w-xs">"{currentPrompt}"</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRetry} disabled={isGenerating}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating || !imageLoaded}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isGenerating || !imageLoaded || saveImage.isPending} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                    {saveImage.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
