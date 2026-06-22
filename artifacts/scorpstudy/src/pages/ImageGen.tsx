import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveImage } from "@workspace/api-client-react";
import { ImageIcon, Loader2, Save, Download, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Realistic");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const saveImage = useSaveImage();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    setIsGenerating(true);
    
    // Construct Pollinations AI URL
    const enhancedPrompt = `${prompt}, ${style} style, high quality, educational`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const randomSeed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${randomSeed}`;
    
    // Simulate generation delay for better UX
    setTimeout(() => {
      setImageUrl(url);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSave = async () => {
    if (!imageUrl) return;
    try {
      await saveImage.mutateAsync({ data: { prompt, imageUrl, style } });
      toast.success("Image saved to history");
    } catch (error) {
      toast.error("Failed to save image");
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scorpstudy-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
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
          <p className="text-slate-500 mt-1">Visualize complex concepts, anatomy, or historical events.</p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 space-y-2">
                <Input 
                  placeholder="Describe what you want to see... (e.g., diagram of a plant cell, roman empire map)" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  className="h-12 text-base"
                />
              </div>
              <div className="w-full md:w-48 space-y-2">
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Realistic">Realistic</SelectItem>
                    <SelectItem value="Diagram">Diagram</SelectItem>
                    <SelectItem value="Cartoon">Cartoon</SelectItem>
                    <SelectItem value="Artistic">Artistic</SelectItem>
                    <SelectItem value="Blueprint">Blueprint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()} 
                className="h-12 px-8 bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
          {imageUrl ? (
            <>
              <div className="relative group bg-slate-100 flex-1 flex items-center justify-center p-4">
                {isGenerating ? (
                  <div className="flex flex-col items-center text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-fuchsia-500" />
                    <p>Crafting your image...</p>
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt={prompt} 
                    className="max-w-full max-h-[600px] object-contain rounded-lg shadow-sm"
                    onLoad={() => setIsGenerating(false)}
                  />
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                <p className="text-sm text-slate-500 font-medium truncate max-w-md">"{prompt}"</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave} disabled={isGenerating || saveImage.isPending} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                    {saveImage.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
               <ImageIcon className="w-16 h-16 mb-4 text-slate-200" />
               <h3 className="text-lg font-medium text-slate-600 mb-2">No image generated</h3>
               <p className="max-w-sm">Enter a prompt above and click generate to visualize your study materials.</p>
             </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
