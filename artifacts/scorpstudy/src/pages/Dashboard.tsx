import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, FileText, CheckSquare, Layers, ImageIcon, BookOpen, Activity } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const quickActions = [
  { href: "/dashboard/chat", label: "Chat Tutor", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/dashboard/summarizer", label: "Summarize", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
  { href: "/dashboard/quiz", label: "New Quiz", icon: CheckSquare, color: "text-violet-600", bg: "bg-violet-50" },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
  { href: "/dashboard/image-gen", label: "Image Gen", icon: ImageIcon, color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
  { href: "/dashboard/notes", label: "New Note", icon: BookOpen, color: "text-pink-600", bg: "bg-pink-50" },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back! 👋</h1>
          <p className="text-slate-500 mt-1">Ready for another productive session?</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href}>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group">
                  <div className={`w-12 h-12 rounded-full ${action.bg} ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Notes" value={stats?.totalNotes} loading={statsLoading} />
          <StatsCard title="Chats Sessions" value={stats?.totalChats} loading={statsLoading} />
          <StatsCard title="Quizzes Taken" value={stats?.totalQuizzes} loading={statsLoading} />
          <StatsCard title="Avg Quiz Score" value={stats?.avgQuizScore ? `${Math.round(stats.avgQuizScore)}%` : '0%'} loading={statsLoading} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-500" />
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-0">
              {activityLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <Activity className="w-12 h-12 text-slate-200 mb-3" />
                  <p>No activity yet. Start exploring the tools above!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatsCard({ title, value, loading }: { title: string, value?: number | string, loading: boolean }) {
  return (
    <Card className="shadow-sm border-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold text-slate-900">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
