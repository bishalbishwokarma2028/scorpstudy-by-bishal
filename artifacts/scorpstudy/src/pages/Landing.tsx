import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, MessageSquare, FileText, CheckSquare, Layers, ImageIcon, BookOpen,
  Sparkles, Brain, Clock, Star, Zap, Shield, Globe, ChevronDown, Play,
  TrendingUp, Award, Users, BookMarked, Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay },
});

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Bishal's AI Assistant",
    description: "Chat with a smart tutor that knows everything. Ask about any subject — science, math, history, coding. Get detailed, exam-ready answers in seconds.",
    color: "text-blue-500",
    bg: "bg-blue-50",
    gradient: "from-blue-500 to-cyan-400",
    badge: "Most Popular",
  },
  {
    icon: FileText,
    title: "PDF Summarizer",
    description: "Paste any long text or paste your textbook content. Get a concise summary, key bullet points, and auto-generated exam questions instantly.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    gradient: "from-indigo-500 to-purple-400",
    badge: null,
  },
  {
    icon: CheckSquare,
    title: "Quiz Generator",
    description: "Test yourself with AI-crafted quizzes on any topic. Choose difficulty and question count. No two quizzes are the same — endless practice.",
    color: "text-violet-500",
    bg: "bg-violet-50",
    gradient: "from-violet-500 to-fuchsia-400",
    badge: null,
  },
  {
    icon: Layers,
    title: "Flashcard Maker",
    description: "Type your topic and get beautifully designed flashcards in seconds. Flip through them to memorize faster. Built for spaced repetition learning.",
    color: "text-purple-500",
    bg: "bg-purple-50",
    gradient: "from-purple-500 to-pink-400",
    badge: null,
  },
  {
    icon: Camera,
    title: "Image Question Solver",
    description: "Snap a photo of any question paper, textbook page, or worksheet. The AI reads it, identifies every question, and solves them step by step.",
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-50",
    gradient: "from-fuchsia-500 to-rose-400",
    badge: "New",
  },
  {
    icon: BookOpen,
    title: "Smart Notes",
    description: "Write notes and let AI enhance them, add structure, fix grammar, and create summaries. Export to PDF or generate a quiz straight from your notes.",
    color: "text-pink-500",
    bg: "bg-pink-50",
    gradient: "from-pink-500 to-rose-400",
    badge: null,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Zap,
    title: "Sign Up Free",
    desc: "Create your account in under 30 seconds. No credit card required. Set up your learning profile — level, goals, preferred language.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    step: "02",
    icon: Brain,
    title: "Personalize Your AI",
    desc: "Tell ScorpStudy your study level, goals, and preferred language. The AI adapts every response to suit you perfectly.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Study Smarter",
    desc: "Use all 6 AI-powered tools together. Chat, quiz yourself, make notes, summarize content, and track your progress daily.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const STATS = [
  { value: "6", label: "AI Study Tools", icon: Sparkles, color: "text-violet-600" },
  { value: "30+", label: "Supported Languages", icon: Globe, color: "text-blue-600" },
  { value: "24/7", label: "Always Available", icon: Clock, color: "text-emerald-600" },
  { value: "Free", label: "To Get Started", icon: Star, color: "text-amber-500" },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    level: "Bachelor — Computer Science",
    text: "ScorpStudy completely changed how I study. The AI explains code better than most of my professors. The quiz generator helped me score top marks in my exams!",
    stars: 5,
    avatar: "PS",
    color: "bg-blue-500",
  },
  {
    name: "Rajan Thapa",
    level: "+2 Science Student",
    text: "I was struggling with Physics. After using Bishal's Assistant for 2 weeks, I understand every concept deeply. The topper mode gives exactly what I need for board exams.",
    stars: 5,
    avatar: "RT",
    color: "bg-violet-500",
  },
  {
    name: "Ananya Patel",
    level: "Master's — MBA",
    text: "The summarizer saves me hours every week. I paste a 20-page case study and get all the key points in seconds. The flashcard maker is perfect for case study revision.",
    stars: 5,
    avatar: "AP",
    color: "bg-pink-500",
  },
];

const FAQS = [
  {
    q: "Is ScorpStudy completely free?",
    a: "Yes! ScorpStudy is free to use. Sign up and access all tools immediately — no credit card, no hidden fees.",
  },
  {
    q: "What subjects can the AI help with?",
    a: "Any subject — Mathematics, Physics, Chemistry, Biology, Computer Science, History, Economics, Literature, Programming languages, and much more. If you can ask it, the AI can answer.",
  },
  {
    q: "Can I use ScorpStudy in my language?",
    a: "Yes! During onboarding you can choose from 60+ world languages. The AI will respond in your preferred language for all tools.",
  },
  {
    q: "What is Topper Mode in Bishal's Assistant?",
    a: "Topper Mode gives ultra-detailed, exam-ready answers covering all subtopics, formulas, examples, memory tricks, and a quick revision summary — exactly how a top student would answer.",
  },
  {
    q: "How does the Image Question Solver work?",
    a: "Upload any photo of a question paper, textbook, or handwritten notes. The AI uses computer vision to read and understand the content, then solves every question step by step.",
  },
  {
    q: "Who built ScorpStudy?",
    a: "ScorpStudy was built by Bishal Bishwokarma — a software developer and student from Nepal passionate about educational technology. Learn more at www.bishalbishwokarma.in.net",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="font-semibold text-slate-800 text-sm pr-4">{faq.q}</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
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
              <Link href="/dashboard"><Button size="sm">Go to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
            ) : (
              <>
                <Link href="/signin"><Button variant="ghost" size="sm" className="text-slate-600 hidden sm:inline-flex">Sign In</Button></Link>
                <Link href="/signup"><Button size="sm" className="rounded-full">Get Started Free</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(120,_40,_200,_0.08),_transparent)] -z-10" />
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-violet-100/40 blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-blue-100/40 blur-3xl -z-10 pointer-events-none" />
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div {...fade(0)} className="flex justify-center mb-6">
              <div className="relative">
                <img src="/logo.png" alt="ScorpStudy" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </motion.div>
            <motion.div {...fade(0.05)} className="mb-4">
              <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-4 py-1.5 rounded-full border border-violet-200">
                <Zap className="w-3.5 h-3.5" /> AI-Powered Study Platform
              </span>
            </motion.div>
            <motion.h1 {...fade(0.1)} className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
              Study Smarter with<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">ScorpStudy</span>
            </motion.h1>
            <motion.p {...fade(0.15)} className="text-base md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your personal AI companion for every student. Ask questions, solve problems, create quizzes,
              summarize textbooks, make flashcards — all in one place. In any language. For free.
            </motion.p>
            <motion.div {...fade(0.2)} className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <Link href={session ? "/dashboard" : "/signup"}>
                <Button size="lg" className="h-12 px-8 rounded-full gap-2 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {!session && (
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base border-slate-200">
                    Sign In
                  </Button>
                </Link>
              )}
            </motion.div>
            {/* Social proof */}
            <motion.div {...fade(0.25)} className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-500" /> 60+ languages supported</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-violet-500" /> Setup in 30 seconds</span>
            </motion.div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="py-10 bg-gradient-to-r from-violet-600 to-indigo-700">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} {...fadeIn(i * 0.08)} className="text-center text-white">
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold">{stat.value}</p>
                    <p className="text-violet-200 text-sm mt-0.5">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto max-w-5xl">
            <motion.div {...fadeIn()} className="text-center mb-14">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">How It Works</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Start learning in 3 simple steps</h2>
              <p className="text-slate-500 max-w-xl mx-auto">No complex setup. No learning curve. Just sign up and start studying smarter from day one.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={i} {...fadeIn(i * 0.12)} className="relative bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <span className="text-4xl font-black text-slate-100 select-none">{step.step}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                        <ArrowRight className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div {...fadeIn()} className="text-center mb-14">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">All Tools</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Everything you need to ace your exams</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Six powerful AI tools built specifically for students — from school to university, in any subject.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div key={i} {...fadeIn(i * 0.07)}
                    className="group relative bg-white p-7 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                    {feat.badge && (
                      <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full ${feat.badge === "New" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}`}>
                        {feat.badge}
                      </span>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${feat.gradient} shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{feat.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-violet-50/30 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div {...fadeIn()} className="text-center mb-14">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">Student Love</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Students are studying smarter</h2>
              <div className="flex justify-center gap-0.5 mt-2">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                <span className="ml-2 text-sm text-slate-500 font-medium">Loved by students worldwide</span>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} {...fadeIn(i * 0.1)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex gap-0.5 mb-4">
                    {Array(t.stars).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>{t.avatar}</div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.level}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why ScorpStudy */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div {...fadeIn()} className="text-center mb-14">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">Why ScorpStudy</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Built differently. Built for students.</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Globe, title: "60+ Languages", desc: "Study in your native language — from Nepali to Japanese to Spanish.", color: "text-blue-600 bg-blue-50" },
                { icon: Brain, title: "AI That Adapts", desc: "Adjusts to your study level, goals, and preferred teaching style.", color: "text-violet-600 bg-violet-50" },
                { icon: BookMarked, title: "All-in-One", desc: "Chat, quiz, flashcards, notes, summarizer — one platform, zero switching.", color: "text-emerald-600 bg-emerald-50" },
                { icon: Award, title: "Exam Ready", desc: "Topper Mode gives comprehensive, structured exam-level answers.", color: "text-amber-600 bg-amber-50" },
                { icon: Camera, title: "Image Solver", desc: "Snap a photo of any question. AI reads and solves it instantly.", color: "text-fuchsia-600 bg-fuchsia-50" },
                { icon: Clock, title: "Saves Hours", desc: "Summarize long texts in seconds. Make flashcards in one click.", color: "text-rose-600 bg-rose-50" },
                { icon: Shield, title: "Always Free", desc: "No paywalls for core features. Students deserve better.", color: "text-green-600 bg-green-50" },
                { icon: Users, title: "Built by a Student", desc: "Created by Bishal — a student who understood the struggle.", color: "text-indigo-600 bg-indigo-50" },
              ].map((item, i) => {
                const Icon = item.icon;
                const [iconColor, bgColor] = item.color.split(" ");
                return (
                  <motion.div key={i} {...fadeIn(i * 0.06)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto max-w-2xl">
            <motion.div {...fadeIn()} className="text-center mb-12">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Frequently asked questions</h2>
            </motion.div>
            <motion.div {...fadeIn(0.1)}>
              <FAQ />
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <motion.div {...fadeIn()} className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl shadow-violet-200">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Ready to study smarter?</h2>
                <p className="text-violet-200 text-base md:text-lg mb-8 max-w-lg mx-auto">
                  Join thousands of students who use ScorpStudy to get better grades, understand concepts faster, and ace their exams.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href={session ? "/dashboard" : "/signup"}>
                    <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 h-12 px-8 rounded-full font-bold text-base gap-2 shadow-lg">
                      {session ? "Go to Dashboard" : "Start for Free"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-violet-300 text-sm mt-5">Free forever • No credit card • Setup in 30 seconds</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="ScorpStudy" className="w-9 h-9 object-contain" />
              <div>
                <p className="font-bold text-slate-900">ScorpStudy</p>
                <p className="text-xs text-primary font-semibold">by Bishal</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400 justify-center">
              <Link href="/signin" className="hover:text-slate-700 transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-slate-700 transition-colors">Sign Up</Link>
              <a href="https://www.bishalbishwokarma.in.net" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors">
                Creator's Website
              </a>
            </div>
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} ScorpStudy by Bishal Bishwokarma</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// needed for GraduationCap import in CTA
function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
