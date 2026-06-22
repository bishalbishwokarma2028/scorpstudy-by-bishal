import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateChat } from "@workspace/api-client-react";
import {
  Plus, Save, Send, Copy, Loader2, Bot, User,
  Wand2, GraduationCap, ImageIcon, X, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VisualData {
  title: string;
  type: string;
  summary: string;
  nodes: { id: string; label: string; detail: string; color: string }[];
  connections: { from: string; to: string; label: string }[];
  keyFacts: string[];
  memoryTip: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-100 border-blue-300 text-blue-900",
  green: "bg-green-100 border-green-300 text-green-900",
  purple: "bg-purple-100 border-purple-300 text-purple-900",
  orange: "bg-orange-100 border-orange-300 text-orange-900",
  red: "bg-red-100 border-red-300 text-red-900",
  teal: "bg-teal-100 border-teal-300 text-teal-900",
};

function VisualModal({ data, onClose }: { data: VisualData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-slate-900">{data.title}</h2>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{data.summary}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0"><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Nodes */}
          {data.nodes && data.nodes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visual Breakdown</h3>
              <div className="space-y-2">
                {data.nodes.map((node, i) => {
                  const colorClass = COLOR_MAP[node.color] ?? COLOR_MAP.blue;
                  const nextNode = data.nodes[i + 1];
                  const connection = data.connections?.find(c => c.from === node.id && c.to === nextNode?.id);
                  return (
                    <div key={node.id}>
                      <div className={`flex gap-3 p-3 rounded-xl border-2 ${colorClass}`}>
                        <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</div>
                        <div>
                          <div className="font-semibold text-sm">{node.label}</div>
                          <div className="text-xs opacity-80 mt-0.5">{node.detail}</div>
                        </div>
                      </div>
                      {connection && (
                        <div className="flex items-center gap-2 pl-9 py-1">
                          <div className="w-0.5 h-5 bg-slate-200" />
                          <span className="text-[10px] text-slate-400 italic">{connection.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Facts */}
          {data.keyFacts && data.keyFacts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">🔑 Must-Remember Facts</h3>
              <div className="space-y-2">
                {data.keyFacts.map((fact, i) => (
                  <div key={i} className="flex gap-2.5 text-sm text-slate-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                    <span className="text-yellow-600 font-bold shrink-0">★</span>
                    <span>{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memory Tip */}
          {data.memoryTip && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧠</span>
                <h3 className="text-sm font-bold text-green-800">Memory Tip</h3>
              </div>
              <p className="text-sm text-green-700">{data.memoryTip}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function callAiChat(messages: Message[], isTopper: boolean): Promise<string> {
  const systemMessages = isTopper
    ? [{
      role: "system",
      content: "You are an elite academic tutor explaining like a top-ranking student. Give EXTREMELY detailed answers — cover every minor subtopic, definition, formula, example, and application. Use structured headers (##), bullet points, numbered steps, and **bold** for critical terms. Include: theory, mechanism, real-world examples, common exam traps, and a quick revision summary at the end. Make your answer so complete that a student could pass any exam just from reading it."
    }]
    : [{
      role: "system",
      content: "You are ScorpStudy — Bishal's AI tutor for college students. Explain concepts clearly, step-by-step. Use **bold** to highlight every important term, formula, or key concept. Use ## headers to organize long answers. Include examples. Be encouraging and educational. Format with markdown."
    }];

  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [...systemMessages, ...messages] }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.content as string;
}

async function callVisualize(text: string): Promise<VisualData> {
  const res = await fetch(`${BASE}/api/ai/visualize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Visualize request failed");
  return res.json();
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTopperMode, setIsTopperMode] = useState(false);
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [visualLoading, setVisualLoading] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveChat = useCreateChat();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      const content = await callAiChat(newMessages, isTopperMode);
      setMessages([...newMessages, { role: "assistant", content }]);
    } catch {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (messages.length === 0) { toast.error("No messages to save"); return; }
    try {
      await saveChat.mutateAsync({
        data: { title: messages[0].content.substring(0, 60) + (messages[0].content.length > 60 ? "..." : ""), messages }
      });
      toast.success("Chat saved to history!");
    } catch {
      toast.error("Failed to save chat");
    }
  };

  const handleVisualize = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg || msg.role !== "assistant") return;
    setVisualLoading(msgIndex);
    try {
      const data = await callVisualize(msg.content.slice(0, 1500));
      setVisualData(data);
    } catch {
      toast.error("Failed to generate visual. Try again.");
    } finally {
      setVisualLoading(null);
    }
  };

  const handleVisualFromSelection = async () => {
    const selected = window.getSelection()?.toString().trim();
    if (!selected || selected.length < 10) {
      const lastAi = [...messages].reverse().find(m => m.role === "assistant");
      if (lastAi) {
        setVisualLoading(-1);
        try {
          const data = await callVisualize(lastAi.content.slice(0, 1500));
          setVisualData(data);
        } catch {
          toast.error("Failed to generate visual");
        } finally {
          setVisualLoading(null);
        }
      } else {
        toast.info("Select some text in the chat, or ask a question first");
      }
      return;
    }
    setVisualLoading(-1);
    try {
      const data = await callVisualize(selected);
      setVisualData(data);
    } catch {
      toast.error("Failed to generate visual");
    } finally {
      setVisualLoading(null);
    }
  };

  return (
    <DashboardLayout>
      {visualData && <VisualModal data={visualData} onClose={() => setVisualData(null)} />}

      <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Bishal's Assistant
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isTopperMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setIsTopperMode(!isTopperMode); toast.info(isTopperMode ? "Standard mode" : "Topper mode — ultra detailed answers!"); }}
              className={isTopperMode ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-slate-600"}
            >
              <GraduationCap className="w-4 h-4 mr-1.5" />
              {isTopperMode ? "Topper ON" : "Topper Style"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVisualFromSelection}
              disabled={visualLoading !== null}
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              {visualLoading === -1 ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-1.5" />}
              Visual Generation
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMessages([])} className="text-slate-600">
              <Plus className="w-4 h-4 mr-1.5" /> New
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={messages.length === 0 || saveChat.isPending} className="text-slate-600">
              {saveChat.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>

        {isTopperMode && (
          <div className="mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium flex items-center gap-2">
            <GraduationCap className="w-4 h-4 shrink-0" />
            Topper Mode — Giving extremely detailed, exam-ready answers with all key points highlighted.
          </div>
        )}

        {/* Chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 min-h-0">
          <CardContent className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4" style={{ overscrollBehavior: "contain" }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary mb-4">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-semibold text-slate-700 mb-2">Ask Bishal's Assistant anything</h2>
                <p className="text-sm max-w-xs">Explain concepts, solve problems, generate examples, or quiz me on any subject.</p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm w-full">
                  {["Explain Newton's Laws of Motion", "What is Photosynthesis?", "How does Recursion work?", "Explain the Water Cycle"].map(s => (
                    <button key={s} onClick={() => setInput(s)} className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-primary transition-colors text-slate-600">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl ${msg.role === "user" ? "bg-primary text-white rounded-tr-sm px-4 py-3" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm px-4 py-3"}`}>
                      {msg.role === "assistant" ? (
                        <>
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-strong:text-primary prose-strong:font-bold prose-h2:text-slate-800 prose-h2:text-base prose-h3:text-slate-700 prose-h3:text-sm prose-li:text-slate-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                            <button
                              onClick={() => handleVisualize(idx)}
                              disabled={visualLoading !== null}
                              className="flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-700 transition-colors disabled:opacity-50"
                            >
                              {visualLoading === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                              Visualize this
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-600 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-slate-500">{isTopperMode ? "Preparing topper-level answer..." : "Thinking..."}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input area */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="relative flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isTopperMode ? "Ask anything — I'll give a complete topper-level answer..." : "Ask your study question... (Enter to send, Shift+Enter for new line)"}
                className="flex-1 resize-none min-h-[52px] max-h-28 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary pr-2"
                rows={2}
              />
              <Button
                size="icon"
                className="h-[52px] w-10 shrink-0 rounded-xl self-end"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">Select text in any answer → click "Visual Generation" to get a diagram</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
