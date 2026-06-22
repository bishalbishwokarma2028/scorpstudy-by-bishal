import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, FileText, CheckSquare, Layers, ImageIcon, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const features = [
    { icon: MessageSquare, title: "AI Chat Tutor", description: "Get answers to your questions instantly, just like chatting with a brilliant friend." },
    { icon: FileText, title: "PDF Summarizer", description: "Paste long texts and get key points, full summaries, and generated exam questions." },
    { icon: CheckSquare, title: "Quiz Generator", description: "Test your knowledge with custom quizzes based on any topic." },
    { icon: Layers, title: "Flashcard Maker", description: "Flip through auto-generated flashcards to memorize facts quickly." },
    { icon: ImageIcon, title: "Image Generator", description: "Visualize complex concepts with instant AI-generated diagrams and realistic images." },
    { icon: BookOpen, title: "Smart Notes", description: "Write notes and let AI enhance and summarize them for better retention." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ScorpStudy</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">Sign In</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-white to-white -z-10"></div>
          <div className="container mx-auto max-w-4xl text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
            >
              Study Smarter with <span className="text-primary">ScorpStudy</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
            >
              Your personal AI study companion that feels like having a brilliant friend who can tutor you at 2am. Overcome procrastination and start grinding hard.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center gap-4"
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-slate-50 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to ace your exams</h2>
              <p className="text-slate-600">Six powerful AI tools designed specifically for college students.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 text-primary">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-100 text-center text-slate-500 bg-white">
        <p>&copy; {new Date().getFullYear()} ScorpStudy by Bishal. All rights reserved.</p>
      </footer>
    </div>
  );
}
