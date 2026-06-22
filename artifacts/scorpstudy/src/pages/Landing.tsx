import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, FileText, CheckSquare, Layers, ImageIcon, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { session } = useAuth();

  const features = [
    { icon: MessageSquare, title: "Bishal's Assistant", description: "Get detailed answers instantly — with Topper Mode for exam-ready comprehensive explanations.", color: "text-blue-500 bg-blue-50" },
    { icon: FileText, title: "PDF Summarizer", description: "Paste long texts and get key points, full summaries, and generated exam questions.", color: "text-indigo-500 bg-indigo-50" },
    { icon: CheckSquare, title: "Quiz Generator", description: "Test your knowledge with unique AI-generated quizzes. 15–100 questions, no repeats.", color: "text-violet-500 bg-violet-50" },
    { icon: Layers, title: "Flashcard Maker", description: "Flip through auto-generated flashcards with 3D animations to memorize facts quickly.", color: "text-purple-500 bg-purple-50" },
    { icon: ImageIcon, title: "Image Generator", description: "Visualize complex concepts with instant AI-generated diagrams and educational images.", color: "text-fuchsia-500 bg-fuchsia-50" },
    { icon: BookOpen, title: "Smart Notes", description: "Write notes and let AI enhance, structure, and summarize them for better retention.", color: "text-pink-500 bg-pink-50" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ScorpStudy" className="w-10 h-10 object-contain" />
            <div className="leading-tight">
              <span className="text-base font-bold text-slate-900 block leading-none">ScorpStudy</span>
              <span className="text-xs text-primary font-semibold block">by Bishal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <Link href="/dashboard"><Button size="sm">Go to Dashboard</Button></Link>
            ) : (
              <>
                <Link href="/signin"><Button variant="ghost" size="sm" className="text-slate-600 hidden sm:inline-flex">Sign In</Button></Link>
                <Link href="/signup"><Button size="sm">Get Started Free</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-white to-white -z-10" />
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center mb-6">
              <img src="/logo.png" alt="ScorpStudy" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Study Smarter with <span className="text-primary">ScorpStudy</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-slate-600 mb-8 max-w-xl mx-auto">
              Your personal AI study companion. Tutor, quiz maker, summarizer, flashcards, image gen — all in one place.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3">
              <Link href={session ? "/dashboard" : "/signup"}>
                <Button size="lg" className="h-11 px-6 rounded-full gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {!session && (
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="h-11 px-6 rounded-full">Sign In</Button>
                </Link>
              )}
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-slate-50 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Everything you need to ace your exams</h2>
              <p className="text-slate-500">Six powerful AI tools designed specifically for college students.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-slate-100 text-center text-sm text-slate-400 bg-white">
        <p>&copy; {new Date().getFullYear()} ScorpStudy by Bishal. All rights reserved.</p>
      </footer>
    </div>
  );
}
