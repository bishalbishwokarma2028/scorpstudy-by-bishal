import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import type { DashboardStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, FileText, CheckSquare, Layers, ImageIcon, BookOpen,
  TrendingUp, Zap, Brain, Target, Star, ArrowRight, Clock,
  Flame,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

// ── helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good evening", emoji: "🌙" };
  return { text: "Burning midnight oil", emoji: "🔥" };
}

const STUDY_TIPS = [
  "🧠 Spaced repetition: review material after 1 day, 3 days, 1 week, then 1 month for long-term memory.",
  "✍️ The Feynman Technique: explain a concept as if teaching a child — gaps in your explanation reveal gaps in understanding.",
  "⏱️ Try the Pomodoro method — 25 min focused study, 5 min break. Your brain consolidates memory during rest.",
  "🎯 Active recall beats re-reading. Close your notes and quiz yourself. Use ScorpStudy's Quiz feature!",
  "💡 Connect new ideas to things you already know — the more hooks, the stronger the memory.",
  "📝 Cornell Notes: split the page into notes + cue questions + summary for powerful review sessions.",
];

const dailyTip = STUDY_TIPS[new Date().getDate() % STUDY_TIPS.length];

// ── quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    href: "/dashboard/chat",
    label: "Bishal's Assistant",
    desc: "Ask anything, get explained",
    icon: MessageSquare,
    gradient: "from-blue-500 to-cyan-400",
    glow: "shadow-blue-200",
    bg: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-400",
  },
  {
    href: "/dashboard/summarizer",
    label: "Summarizer",
    desc: "Condense any content fast",
    icon: FileText,
    gradient: "from-indigo-500 to-purple-400",
    glow: "shadow-indigo-200",
    bg: "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100",
    iconBg: "bg-gradient-to-br from-indigo-500 to-purple-400",
  },
  {
    href: "/dashboard/quiz",
    label: "Quiz Yourself",
    desc: "AI-generated practice tests",
    icon: CheckSquare,
    gradient: "from-violet-500 to-fuchsia-400",
    glow: "shadow-violet-200",
    bg: "bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-100",
    iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-400",
  },
  {
    href: "/dashboard/flashcards",
    label: "Flashcards",
    desc: "Spaced repetition study",
    icon: Layers,
    gradient: "from-purple-500 to-pink-400",
    glow: "shadow-purple-200",
    bg: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100",
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-400",
  },
  {
    href: "/dashboard/image-gen",
    label: "Image Generator",
    desc: "Visualize concepts with AI",
    icon: ImageIcon,
    gradient: "from-fuchsia-500 to-rose-400",
    glow: "shadow-fuchsia-200",
    bg: "bg-gradient-to-br from-fuchsia-50 to-rose-50 border-fuchsia-100",
    iconBg: "bg-gradient-to-br from-fuchsia-500 to-rose-400",
  },
  {
    href: "/dashboard/notes",
    label: "Smart Notes",
    desc: "AI-powered note editor",
    icon: BookOpen,
    gradient: "from-pink-500 to-rose-400",
    glow: "shadow-pink-200",
    bg: "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-400",
  },
];

// ── activity icons / colours ──────────────────────────────────────────────────
const ACTIVITY_CONFIG: Record<string, { icon: typeof MessageSquare; color: string; label: string }> = {
  chat:          { icon: MessageSquare, color: "bg-blue-100 text-blue-600",   label: "Chat" },
  summary:       { icon: FileText,      color: "bg-indigo-100 text-indigo-600", label: "Summary" },
  quiz:          { icon: CheckSquare,   color: "bg-violet-100 text-violet-600", label: "Quiz" },
  flashcard_set: { icon: Layers,        color: "bg-purple-100 text-purple-600", label: "Flashcards" },
};

// ── stat card data ─────────────────────────────────────────────────────────────
function buildStatCards(stats: DashboardStats | undefined) {
  return [
    {
      label: "Notes Written",
      value: stats?.totalNotes ?? 0,
      icon: BookOpen,
      gradient: "from-pink-500 to-rose-400",
      bg: "from-pink-50 to-rose-50",
      border: "border-pink-100",
      text: "text-pink-600",
    },
    {
      label: "Chat Sessions",
      value: stats?.totalChats ?? 0,
      icon: MessageSquare,
      gradient: "from-blue-500 to-cyan-400",
      bg: "from-blue-50 to-cyan-50",
      border: "border-blue-100",
      text: "text-blue-600",
    },
    {
      label: "Quizzes Taken",
      value: stats?.totalQuizzes ?? 0,
      icon: Brain,
      gradient: "from-violet-500 to-fuchsia-400",
      bg: "from-violet-50 to-fuchsia-50",
      border: "border-violet-100",
      text: "text-violet-600",
    },
    {
      label: "Avg Quiz Score",
      value: stats?.avgQuizScore ? `${Math.round(stats.avgQuizScore as number)}%` : "—",
      icon: Target,
      gradient: "from-emerald-500 to-teal-400",
      bg: "from-emerald-50 to-teal-50",
      border: "border-emerald-100",
      text: "text-emerald-600",
    },
  ];
}

// ── component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { profile } = useUserProfile();
  const greeting = getGreeting();
  const statCards = buildStatCards(stats);
  const displayName = profile?.nickname?.trim() || profile?.firstName?.trim() || "Scholar";

  return (
    <DashboardLayout>
      <div className="space-y-7 max-w-6xl mx-auto">

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-7 text-white shadow-xl shadow-purple-200">
          {/* decorative blobs */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{greeting.emoji}</span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {greeting.text}, {displayName}!
                </h1>
              </div>
              <p className="text-purple-200 text-sm sm:text-base">
                {format(new Date(), "EEEE, MMMM d, yyyy")} — Keep pushing forward 🚀
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-300" />
              </div>
              <div>
                <p className="text-xs text-purple-200 font-medium">Study Streak</p>
                <p className="text-lg font-bold leading-tight">
                  {typeof stats?.totalChats === "number" && typeof stats?.totalQuizzes === "number"
                    ? stats.totalChats + stats.totalQuizzes
                    : "—"} sessions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bg} border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className={`w-4 h-4 ${card.text} opacity-50`} />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-9 w-16 mb-1" />
                ) : (
                  <p className="text-3xl font-black text-slate-900 leading-none mb-1">{card.value ?? 0}</p>
                )}
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Quick Start</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className={`group flex flex-col items-center p-4 rounded-2xl border bg-gradient-to-br ${action.bg} hover:shadow-lg ${action.glow} transition-all duration-200 cursor-pointer hover:-translate-y-0.5`}>
                    <div className={`w-12 h-12 rounded-2xl ${action.iconBg} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight mb-0.5">{action.label}</span>
                    <span className="text-[10px] text-slate-400 text-center leading-tight hidden sm:block">{action.desc}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Bottom row: Activity + Study Tip ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              </div>
              <Link href="/dashboard/history">
                <span className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 cursor-pointer">
                  View all <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {activityLoading ? (
                <div className="p-5 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {activity.slice(0, 6).map((item) => {
                    const config = ACTIVITY_CONFIG[item.type as keyof typeof ACTIVITY_CONFIG];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400 capitalize mt-0.5">{config.label}</p>
                        </div>
                        <span className="text-[10px] text-slate-300 shrink-0">
                          {format(new Date(item.createdAt), "MMM d")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No activity yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start with any tool above — your history will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Study Tip + Flashcards Streak */}
          <div className="flex flex-col gap-4">
            {/* Study tip */}
            <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <h3 className="text-sm font-bold text-amber-900">Study Tip of the Day</h3>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{dailyTip}</p>
            </div>

            {/* Progress snapshot */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-sm">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-emerald-900">Your Progress</h3>
              </div>
              <div className="space-y-3">
                {statsLoading ? (
                  [1,2,3].map(i => <Skeleton key={i} className="h-6 w-full" />)
                ) : (
                  <>
                    <ProgressRow label="📝 Notes" value={stats?.totalNotes ?? 0} max={20} color="bg-pink-400" />
                    <ProgressRow label="💬 Chats" value={stats?.totalChats ?? 0} max={20} color="bg-blue-400" />
                    <ProgressRow label="🧠 Quizzes" value={stats?.totalQuizzes ?? 0} max={20} color="bg-violet-400" />
                    <ProgressRow label="🃏 Flashcards" value={stats?.totalFlashcardSets ?? 0} max={10} color="bg-purple-400" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProgressRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((Number(value) / max) * 100));
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden border border-white/40">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
