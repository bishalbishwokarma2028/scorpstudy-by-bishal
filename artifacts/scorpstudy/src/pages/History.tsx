import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetRecentActivity } from "@workspace/api-client-react";
import { Clock, MessageSquare, FileText, CheckSquare, Layers, ImageIcon, Trash2, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

const typeConfig = {
  chat: { icon: MessageSquare, color: "bg-blue-100 text-blue-700", label: "Chat Session", link: "/dashboard/chat" },
  summary: { icon: FileText, color: "bg-indigo-100 text-indigo-700", label: "Summary", link: "/dashboard/summarizer" },
  quiz: { icon: CheckSquare, color: "bg-violet-100 text-violet-700", label: "Quiz Result", link: "/dashboard/quiz" },
  flashcard_set: { icon: Layers, color: "bg-purple-100 text-purple-700", label: "Flashcards", link: "/dashboard/flashcards" },
  image: { icon: ImageIcon, color: "bg-fuchsia-100 text-fuchsia-700", label: "Generated Image", link: "/dashboard/image-gen" },
  note: { icon: FileText, color: "bg-pink-100 text-pink-700", label: "Note", link: "/dashboard/notes" },
};

export default function History() {
  const [filter, setFilter] = useState<string>("all");
  const { data: activity, isLoading } = useGetRecentActivity();

  const filteredActivity = activity?.filter(item => filter === "all" || item.type === filter) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-slate-700" />
              Activity History
            </h1>
            <p className="text-slate-500 mt-1">Review your past study sessions and generated materials.</p>
          </div>
          
          <div className="w-48">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="chat">Chats</SelectItem>
                <SelectItem value="summary">Summaries</SelectItem>
                <SelectItem value="quiz">Quizzes</SelectItem>
                <SelectItem value="flashcard_set">Flashcards</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : filteredActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredActivity.map((item) => {
                  const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.note;
                  const Icon = config.icon;
                  
                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 text-base">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">{config.label}</Badge>
                            <span className="text-xs text-slate-400">
                              {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={config.link}>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-blue-50">
                            Go to Tool <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-16 text-slate-400">
                <Clock className="w-16 h-16 mb-4 text-slate-200" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No history found</h3>
                <p className="max-w-sm">You haven't generated any {filter !== 'all' ? filter : 'study materials'} yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
