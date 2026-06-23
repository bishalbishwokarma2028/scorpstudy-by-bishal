import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetRecentActivity } from "@workspace/api-client-react";
import { Clock, MessageSquare, FileText, CheckSquare, Layers, ImageIcon, Loader2, ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

const typeConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string; link: (id: string) => string }> = {
  chat: { icon: MessageSquare, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Chat Session", link: (id) => `/dashboard/chat?sessionId=${id.replace("chat-", "")}` },
  summary: { icon: FileText, color: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Summary", link: () => "/dashboard/summarizer" },
  quiz: { icon: CheckSquare, color: "bg-violet-100 text-violet-700 border-violet-200", label: "Quiz Result", link: () => "/dashboard/quiz" },
  flashcard_set: { icon: Layers, color: "bg-purple-100 text-purple-700 border-purple-200", label: "Flashcards", link: () => "/dashboard/flashcards" },
  image: { icon: ImageIcon, color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", label: "Generated Image", link: () => "/dashboard/image-gen" },
  note: { icon: BookOpen, color: "bg-pink-100 text-pink-700 border-pink-200", label: "Note", link: () => "/dashboard/notes" },
};

export default function History() {
  const [filter, setFilter] = useState<string>("all");
  const { data: activity, isLoading, refetch, isFetching } = useGetRecentActivity();

  const filtered = (activity || []).filter(item => filter === "all" || item.type === filter);

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-slate-600" />
              Activity History
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              All your study sessions — auto-saved. Click a chat to continue where you left off.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 text-xs h-9">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="chat">💬 Chats</SelectItem>
                <SelectItem value="summary">📄 Summaries</SelectItem>
                <SelectItem value="quiz">✅ Quizzes</SelectItem>
                <SelectItem value="flashcard_set">🃏 Flashcards</SelectItem>
                <SelectItem value="image">🖼️ Images</SelectItem>
                <SelectItem value="note">📝 Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-3" />
                <p className="text-sm text-slate-400">Loading your history...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filtered.map((item) => {
                  const config = typeConfig[item.type as keyof typeof typeConfig] ?? typeConfig.note;
                  const Icon = config.icon;
                  const link = config.link(item.id);

                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">{item.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">{config.label}</Badge>
                            <span className="text-xs text-slate-400">
                              {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                            </span>
                            {item.type === "chat" && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                Click to resume →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link href={link}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 gap-1"
                        >
                          {item.type === "chat" ? "Resume" : "Open"}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-16 text-slate-400">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-5">
                  <Clock className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-base font-semibold text-slate-600 mb-2">No history found</h3>
                <p className="text-sm max-w-xs">
                  {filter !== "all"
                    ? `No ${typeConfig[filter]?.label.toLowerCase() ?? filter} activity yet.`
                    : "Start studying! Your activity will appear here automatically."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {filtered.length > 0 && (
          <p className="text-center text-xs text-slate-400">
            Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""} • Chats auto-save after every response
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
