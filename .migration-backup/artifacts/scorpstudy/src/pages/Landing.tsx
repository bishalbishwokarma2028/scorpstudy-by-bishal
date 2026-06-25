import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, MessageSquare, FileText, CheckSquare, Layers, ImageIcon, BookOpen,
  Sparkles, Brain, Clock, Star, Zap, Shield, Globe, ChevronDown, Play,
  TrendingUp, Award, Users, BookMarked, Camera, CheckCircle, XCircle,
  Lightbulb, Target, Rocket, Heart, BarChart2, BookCheck, FlaskConical,
  Code2, Calculator, Atom, Languages, History, Music, Palette,
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
    description: "Paste any long text or textbook content. Get a concise summary, key bullet points, and auto-generated exam questions instantly.",
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
  { value: "60+", label: "Supported Languages", icon: Globe, color: "text-blue-600" },
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
  {
    name: "Liu Wei",
    level: "Bachelor — Engineering",
    text: "Being able to use ScorpStudy in Chinese is amazing. I set my preferred language and the AI answers everything in Mandarin. It's like having a personal tutor in my own language.",
    stars: 5,
    avatar: "LW",
    color: "bg-emerald-500",
  },
  {
    name: "Amira Hassan",
    level: "SEE Student",
    text: "Before ScorpStudy I used to spend 3 hours on homework. Now it takes me 45 minutes. The step-by-step explanations are so clear. I actually understand the 'why' now!",
    stars: 5,
    avatar: "AH",
    color: "bg-amber-500",
  },
  {
    name: "Carlos Rivera",
    level: "+2 Management",
    text: "The quiz generator is my secret weapon before every exam. I just type a topic and get 20 custom questions instantly. My grades went from C to A in one semester.",
    stars: 5,
    avatar: "CR",
    color: "bg-rose-500",
  },
];

const SUBJECTS = [
  { icon: Calculator, label: "Mathematics", color: "bg-blue-100 text-blue-700" },
  { icon: Atom, label: "Physics", color: "bg-violet-100 text-violet-700" },
  { icon: FlaskConical, label: "Chemistry", color: "bg-green-100 text-green-700" },
  { icon: Brain, label: "Biology", color: "bg-emerald-100 text-emerald-700" },
  { icon: Code2, label: "Programming", color: "bg-indigo-100 text-indigo-700" },
  { icon: History, label: "History", color: "bg-amber-100 text-amber-700" },
  { icon: Globe, label: "Geography", color: "bg-teal-100 text-teal-700" },
  { icon: Languages, label: "Languages", color: "bg-pink-100 text-pink-700" },
  { icon: BarChart2, label: "Economics", color: "bg-orange-100 text-orange-700" },
  { icon: BookCheck, label: "Literature", color: "bg-purple-100 text-purple-700" },
  { icon: Music, label: "Music Theory", color: "bg-rose-100 text-rose-700" },
  { icon: Palette, label: "Arts & Design", color: "bg-fuchsia-100 text-fuchsia-700" },
];

const STUDY_TIPS = [
  {
    icon: Target,
    title: "Active Recall",
    tip: "Instead of re-reading, test yourself. Use ScorpStudy's Quiz Generator to practice active recall — the most effective study technique proven by science.",
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100",
  },
  {
    icon: Rocket,
    title: "Spaced Repetition",
    tip: "Review information at increasing intervals. Use Flashcards daily — study new cards, then revisit older ones. This is how memory champions learn.",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    icon: Lightbulb,
    title: "The Feynman Technique",
    tip: "Learn by explaining. Ask Bishal's Assistant to explain a concept, then try to explain it back in your own words. If you can teach it, you've mastered it.",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  {
    icon: Heart,
    title: "Interleaving Practice",
    tip: "Don't study one topic for hours. Mix subjects. Use ScorpStudy's tools across different topics in a session for deeper long-term retention.",
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-100",
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
    q: "How does personalization work?",
    a: "When you sign up, ScorpStudy asks about your study level, learning goals, preferred language, and interaction style. Every AI response is then tailored to your profile — from vocabulary complexity to teaching tone.",
  },
  {
    q: "Can I export my notes as PDF?",
    a: "Yes! In Smart Notes, click 'Export to PDF' to generate a beautifully formatted PDF of any note — with your title, content, headings, and formatting all preserved.",
  },
  {
    q: "Who built ScorpStudy?",
    a: "ScorpStudy was built by Bishal Bishwokarma — a software developer and student from Nepal passionate about educational technology. Learn more at www.bishalbishwokarma.in.net",
  },
];

const OLD_VS_NEW = [
  { old: "Hours reading the same textbook page", new: "Summarize any text in seconds" },
  { old: "Making flashcards by hand — one by one", new: "Generate 10 flashcards in one click" },
  { old: "Guessing what might be on the exam", new: "AI creates custom practice quizzes for you" },
  { old: "Stuck on a question with no help available", new: "Get step-by-step help 24/7, any subject" },
  { old: "Notes that are hard to understand later", new: "AI enhances and structures your notes automatically" },
  { old: "Can't afford expensive tutors or apps", new: "Completely free — no paywalls" },
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
                <Zap className="w-3.5 h-3.5" /> Bishal's AI Learning Platform
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
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
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

        {/* Subjects We Cover */}
        <section className="py-20 px-4 bg-gradient-to-br from-violet-50 to-indigo-50">
          <div className="container mx-auto max-w-5xl">
            <motion.div {...fadeIn()} className="text-center mb-12">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">Subject Coverage</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Every subject. Every level.</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Whether you're studying for SEE, +2, Bachelor's, or a Master's degree — ScorpStudy covers every subject you need.</p>
            </motion.div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-10">
              {SUBJECTS.map((subj, i) => {
                const Icon = subj.icon;
                return (
                  <motion.div key={i} {...fadeIn(i * 0.04)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${subj.color.replace("text-", "border-").replace("-700", "-200").replace("bg-", "bg-")} ${subj.color.split(" ")[0]} hover:scale-105 transition-transform cursor-default`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subj.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{subj.label}</span>
                  </motion.div>
                );
              })}
            </div>
            <motion.div {...fadeIn(0.2)} className="bg-white rounded-2xl p-6 border border-violet-100 shadow-sm text-center">
              <p className="text-slate-600 text-sm leading-relaxed">
                <span className="font-bold text-violet-700">And much more!</span> The AI can help with any topic — Accounting, Law, Medicine, Psychology, Engineering, Architecture, and every other subject. If you can ask it, ScorpStudy can answer it.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Old Way vs ScorpStudy */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div {...fadeIn()} className="text-center mb-12">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">The Difference</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Old way vs. ScorpStudy</h2>
              <p className="text-slate-500 max-w-xl mx-auto">See why thousands of students are switching to a smarter way to study.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div {...fadeIn(0.05)} className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <h3 className="font-bold text-red-700">Old Way of Studying</h3>
                </div>
                <ul className="space-y-3">
                  {OLD_VS_NEW.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-red-600">
                      <span className="text-red-300 shrink-0 mt-0.5">✗</span>
                      {item.old}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div {...fadeIn(0.1)} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <h3 className="font-bold text-emerald-700">With ScorpStudy</h3>
                </div>
                <ul className="space-y-3">
                  {OLD_VS_NEW.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-700">
                      <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">✓</span>
                      {item.new}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Study Tips */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto max-w-5xl">
            <motion.div {...fadeIn()} className="text-center mb-12">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">Study Science</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Proven techniques for top students</h2>
              <p className="text-slate-500 max-w-xl mx-auto">ScorpStudy is built around the most effective learning methods backed by cognitive science research.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {STUDY_TIPS.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <motion.div key={i} {...fadeIn(i * 0.09)} className={`p-6 rounded-2xl border ${tip.bg}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0`}>
                        <Icon className={`w-5 h-5 ${tip.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 mb-2">{tip.title}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{tip.tip}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <motion.div {...fadeIn(0.2)} className="mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
              <p className="font-bold text-lg mb-1">ScorpStudy is built for all of these techniques</p>
              <p className="text-violet-200 text-sm">Quiz Generator for Active Recall • Flashcards for Spaced Repetition • AI Chat for Feynman Technique • Multi-tool workflow for Interleaving</p>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div {...fadeIn()} className="text-center mb-14">
              <span className="text-sm font-bold text-violet-600 uppercase tracking-widest">Student Love</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">Students around the world are studying smarter</h2>
              <div className="flex justify-center gap-0.5 mt-2">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                <span className="ml-2 text-sm text-slate-500 font-medium">Loved by students worldwide</span>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} {...fadeIn(i * 0.08)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
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
        <section className="py-20 px-4 bg-slate-50">
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

        {/* Creator spotlight */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div {...fadeIn()} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div>
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Meet the Creator</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold mt-2 mb-3">Built by Bishal Bishwokarma</h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Bishal is a software developer and student from Nepal who experienced firsthand how hard it was to find quality, affordable learning tools. He built ScorpStudy to give every student — regardless of where they're from or what language they speak — access to a world-class AI tutor. For free.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["AI & Machine Learning", "Educational Technology", "Software Development", "Student Empowerment"].map(tag => (
                      <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/10 text-violet-200 font-medium">{tag}</span>
                    ))}
                  </div>
                  <a href="https://www.bishalbishwokarma.in.net" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-5 text-sm text-violet-300 hover:text-violet-200 transition-colors font-medium">
                    Visit Creator's Website <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
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
                  Join students worldwide who use ScorpStudy to get better grades, understand concepts faster, and ace their exams.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href={session ? "/dashboard" : "/signup"}>
                    <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 h-12 px-8 rounded-full font-bold text-base gap-2 shadow-lg">
                      {session ? "Go to Dashboard" : "Start for Free"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-wrap justify-center gap-6 mt-6 text-violet-300 text-xs font-medium">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Free forever</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> No credit card</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Setup in 30 seconds</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 60+ languages</span>
                </div>
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

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
