import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAiGenerateFlashcards, useSaveFlashcardSet } from "@workspace/api-client-react";
import { Layers, Loader2, Save, RefreshCw, ArrowLeft, ArrowRight, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Flashcard {
  front: string;
  back: string;
}

export default function Flashcards() {
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const generateCards = useAiGenerateFlashcards();
  const saveSet = useSaveFlashcardSet();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    try {
      const response = await generateCards.mutateAsync({ data: { topic } });
      setCards(response.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      toast.success("Flashcards generated");
    } catch (error) {
      toast.error("Failed to generate flashcards");
    }
  };

  const handleSave = async () => {
    if (!cards.length) return;
    try {
      await saveSet.mutateAsync({ data: { topic, cards } });
      toast.success("Flashcard set saved");
    } catch (error) {
      toast.error("Failed to save flashcards");
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const shuffleCards = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
    }, 150);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            Flashcard Maker
          </h1>
          <p className="text-slate-500 mt-1">Generate and study interactive flashcards on any topic.</p>
        </div>

        <div className="flex gap-2">
          <Input 
            placeholder="Enter a topic (e.g., Spanish Basics, Anatomy, History Dates)" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button onClick={handleGenerate} disabled={generateCards.isPending || !topic.trim()} className="bg-purple-600 hover:bg-purple-700">
            {generateCards.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Layers className="w-4 h-4 mr-2" />}
            Generate
          </Button>
        </div>

        {cards.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="flex justify-between w-full max-w-2xl mb-4 text-sm font-medium text-slate-500 px-4">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={shuffleCards} className="h-8">
                  <Shuffle className="w-4 h-4 mr-1" /> Shuffle
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveSet.isPending} className="h-8 text-purple-600">
                  <Save className="w-4 h-4 mr-1" /> Save Set
                </Button>
              </div>
            </div>

            <div className="relative w-full max-w-2xl h-[400px] perspective-1000">
              <motion.div
                className="w-full h-full relative transform-style-3d cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <Card className="absolute w-full h-full backface-hidden border-2 border-slate-200 hover:border-purple-200 transition-colors shadow-sm flex items-center justify-center p-8 text-center bg-white rounded-2xl">
                  <div className="text-3xl font-bold text-slate-800 leading-tight">
                    {cards[currentIndex].front}
                  </div>
                  <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium">Click to flip</div>
                </Card>

                {/* Back */}
                <Card className="absolute w-full h-full backface-hidden rotate-y-180 border-2 border-purple-200 shadow-md flex items-center justify-center p-8 text-center bg-purple-50 rounded-2xl">
                  <div className="text-2xl font-medium text-purple-900 leading-relaxed">
                    {cards[currentIndex].back}
                  </div>
                  <div className="absolute bottom-4 right-4 text-xs text-purple-400 font-medium">Click to flip</div>
                </Card>
              </motion.div>
            </div>

            <div className="flex items-center gap-6 mt-8">
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={prevCard}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="text-sm font-medium text-slate-400 w-24 text-center">
                Use arrows to navigate
              </div>
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={nextCard}>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 mt-4 min-h-[400px]">
            <div className="text-center text-slate-400 max-w-sm px-4">
              <Layers className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-600 mb-2">No flashcards yet</p>
              <p className="text-sm">Enter a topic above and let AI generate a study set for you instantly.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
