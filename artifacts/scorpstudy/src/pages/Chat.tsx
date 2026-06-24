import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Save, Send, Copy, Loader2, Bot, User,
  Wand2, GraduationCap, ImageIcon, X, Sparkles,
  Paperclip, FileText, Image as ImgIcon, Check,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useLocation } from "wouter";

async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: { str?: string }) => item.str ?? "").join(" ") + "\n";
  }
  return text.trim().slice(0, 12000);
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachmentName?: string;
}

interface AttachedFile {
  name: string;
  kind: "image" | "document";
  content: string;
  mimeType: string;
  thumbnail?: string;
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

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// Module-level state — persists across route changes in this SPA
const persist = {
  messages: [] as Message[],
  sessionChatId: null as number | null,
  isTopperMode: false,
  loadedSessionId: null as number | null,
};

function VisualModal({ data, onClose }: { data: VisualData; onClose: () => void }) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{data.title}</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1 ml-9">{data.summary}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 rounded-full"><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-5 space-y-6">
          {data.nodes?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Visual Breakdown</h3>
              <p className="text-[11px] text-slate-400 mb-4">Tap any point to see a full explanation</p>
              <div className="space-y-2">
                {data.nodes.map((node, i) => {
                  const colorClass = COLOR_MAP[node.color] ?? COLOR_MAP.blue;
                  const nextNode = data.nodes[i + 1];
                  const conn = data.connections?.find(c => c.from === node.id && c.to === nextNode?.id);
                  const isExpanded = expandedNode === node.id;
                  return (
                    <div key={node.id}>
                      <button
                        className={`w-full text-left flex gap-3 p-3 rounded-xl border-2 ${colorClass} shadow-sm transition-all active:scale-[0.99] cursor-pointer hover:shadow-md`}
                        onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm flex items-center justify-between gap-2">
                            <span>{node.label}</span>
                            <span className="text-[10px] font-normal opacity-60 shrink-0">{isExpanded ? "▲ hide" : "▼ explain"}</span>
                          </div>
                          {node.detail && !isExpanded && (
                            <div className="text-xs opacity-75 mt-0.5 line-clamp-1">{node.detail}</div>
                          )}
                        </div>
                      </button>

                      {/* Expanded explanation panel */}
                      {isExpanded && (
                        <div className={`mx-2 p-4 rounded-b-xl border-x-2 border-b-2 ${colorClass} bg-white/80`}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-base shrink-0">📖</span>
                            <p className="text-sm font-semibold text-slate-800">{node.label} — Explanation</p>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{node.detail}</p>
                          {conn && (
                            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 italic flex items-center gap-1.5">
                              <span className="font-semibold text-slate-600">Next step:</span> {conn.label} → {nextNode?.label}
                            </div>
                          )}
                        </div>
                      )}

                      {!isExpanded && conn && (
                        <div className="flex items-center gap-2 pl-10 py-1">
                          <div className="w-0.5 h-5 bg-slate-200 rounded" />
                          <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{conn.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.keyFacts?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">🔑 Must Remember</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.keyFacts.map((fact, i) => (
                  <div key={i} className="flex gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <span className="text-amber-500 font-bold shrink-0">★</span>
                    <span className="text-slate-700">{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.memoryTip && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🧠</span>
                <h3 className="text-sm font-bold text-emerald-800">Memory Trick</h3>
              </div>
              <p className="text-sm text-emerald-700 italic">"{data.memoryTip}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function callVisualize(text: string): Promise<VisualData> {
  const res = await fetch(`${BASE}/api/ai/visualize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Visualize failed");
  return res.json();
}

async function autoSaveChat(msgs: Message[]): Promise<void> {
  if (msgs.length < 2) return;
  try {
    const rawTitle = msgs[0].content.replace(/\[Document:[^\]]*\]/g, "").trim();
    const title = rawTitle.slice(0, 80) + (rawTitle.length > 80 ? "..." : "");
    if (persist.sessionChatId === null) {
      const res = await fetch(`${BASE}/api/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, messages: msgs }),
      });
      if (res.ok) { const d = await res.json(); persist.sessionChatId = d.id; }
    } else {
      await fetch(`${BASE}/api/chats/${persist.sessionChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
    }
  } catch { /* silent */ }
}

const STARTERS = [
  "Explain Newton's Laws of Motion",
  "What is Photosynthesis?",
  "How does Recursion work?",
  "Translate: मलाई पानी चाहिन्छ",
  "Explain the Water Cycle",
  "What is Quantum Mechanics?",
];

export default function Chat() {
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(persist.messages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTopperMode, setIsTopperMode] = useState(persist.isTopperMode);
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [visualLoading, setVisualLoading] = useState<number | "global" | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [savedThisSession, setSavedThisSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) setTimeout(scrollToBottom, 80);
  }, [messages.length, isLoading, scrollToBottom]);

  // Load session from URL param (e.g. when clicking from History)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("sessionId");
    if (sid) {
      const id = parseInt(sid, 10);
      if (!isNaN(id) && id !== persist.loadedSessionId) {
        persist.loadedSessionId = id;
        persist.sessionChatId = id;
        persist.messages = [];
        setMessages([]);
        fetch(`${BASE}/api/chats/${id}`)
          .then(r => r.json())
          .then(d => {
            if (Array.isArray(d.messages)) {
              persist.messages = d.messages;
              setMessages(d.messages);
            }
          })
          .catch(() => toast.error("Failed to load saved chat"));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const compressImage = (dataUrl: string, maxPx = 1024): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    if (isImage) {
      reader.onload = async () => {
        const raw = reader.result as string;
        const compressed = await compressImage(raw);
        setAttachedFile({ name: file.name, kind: "image", content: compressed, mimeType: "image/jpeg", thumbnail: compressed });
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      toast.info("Reading PDF...");
      extractPdfText(file)
        .then((text) => {
          if (!text.trim()) {
            toast.warning("PDF appears to be image-only or scanned. Text could not be extracted.");
            setAttachedFile({ name: file.name, kind: "document", content: "(This PDF appears to be scanned/image-only — no text could be extracted.)", mimeType: file.type });
          } else {
            setAttachedFile({ name: file.name, kind: "document", content: text, mimeType: file.type });
            toast.success("PDF loaded — ask anything about it!");
          }
        })
        .catch(() => {
          toast.error("Failed to read PDF. Try copying the text manually.");
        });
    } else {
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        setAttachedFile({ name: file.name, kind: "document", content: text.slice(0, 12000), mimeType: file.type });
        if (!text.trim()) toast.info("Could not extract text from this file. Try copying the text directly.");
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;
    setSavedThisSession(false);

    let msgContent = input.trim() || (attachedFile?.kind === "image" ? "Please solve/explain this image." : "");
    let imageData: string | null = null;

    if (attachedFile) {
      if (attachedFile.kind === "image") {
        imageData = attachedFile.content;
      } else {
        msgContent = `[Document: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n**Question:** ${msgContent}`;
      }
    }

    const userMsg: Message = {
      role: "user",
      content: msgContent,
      ...(attachedFile ? { attachmentName: attachedFile.name } : {}),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    persist.messages = newMessages;
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: isTopperMode ? "topper" : "standard",
          ...(imageData ? { image_data: imageData } : {}),
          ...(profile ? { userProfile: profile } : {}),
          ...(user?.id ? { userId: user.id } : {}),
        }),
      });
      if (res.status === 429) {
        const data = await res.json();
        toast.error(data.message ?? "You have crossed today's free quota limit. Try again tomorrow.", { duration: 6000 });
        setMessages(newMessages.slice(0, -1));
        persist.messages = newMessages.slice(0, -1);
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.content as string };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      persist.messages = updatedMessages;
      autoSaveChat(updatedMessages); // background save to history
    } catch {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (messages.length === 0) { toast.error("No messages to save"); return; }
    await autoSaveChat(messages);
    setSavedThisSession(true);
    toast.success("Chat saved to history!");
  };

  const handleNew = () => {
    persist.messages = [];
    persist.sessionChatId = null;
    persist.loadedSessionId = null;
    setMessages([]);
    setInput("");
    setAttachedFile(null);
    setSavedThisSession(false);
    // Clear URL param if present
    if (window.location.search.includes("sessionId")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const handleToggleTopper = () => {
    const newMode = !isTopperMode;
    setIsTopperMode(newMode);
    persist.isTopperMode = newMode;
    toast.info(newMode ? "🎓 Topper Mode — ultra-detailed answers activated!" : "Standard mode activated");
  };

  const handleVisualize = async (msgIdx: number | "selection") => {
    let text = "";
    if (msgIdx === "selection") {
      text = window.getSelection()?.toString().trim() || "";
      if (!text) {
        const lastAi = [...messages].reverse().find(m => m.role === "assistant");
        text = lastAi?.content.slice(0, 1500) || "";
        if (!text) { toast.info("Select text in any answer first, or ask a question"); return; }
      }
      setVisualLoading("global");
    } else {
      text = messages[msgIdx]?.content.slice(0, 1500) || "";
      setVisualLoading(msgIdx);
    }
    try {
      const data = await callVisualize(text);
      setVisualData(data);
    } catch {
      toast.error("Failed to generate visual");
    } finally {
      setVisualLoading(null);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied!");
  };

  return (
    <DashboardLayout>
      {visualData && <VisualModal data={visualData} onClose={() => setVisualData(null)} />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.doc,.docx,.md"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            Bishal's Assistant
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isTopperMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleTopper}
              className={isTopperMode ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : "text-slate-600"}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              {isTopperMode ? "Topper ON" : "Topper Style"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVisualize("selection")}
              disabled={visualLoading !== null}
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              {visualLoading === "global" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-1" />}
              Visual
            </Button>
            <Button variant="outline" size="sm" onClick={handleNew} className="text-slate-600 gap-1">
              <Plus className="w-4 h-4" /> New
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={handleManualSave}
              disabled={messages.length === 0 || savedThisSession}
              className="text-slate-600 gap-1"
            >
              {savedThisSession ? <Check className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
              {savedThisSession ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {isTopperMode && (
          <div className="mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span><strong>Topper Mode:</strong> Ultra-detailed, exam-ready answers with all subtopics, formulas, and examples.</span>
          </div>
        )}

        {/* Chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 min-h-0 shadow-sm">
          <CardContent className="flex-1 overflow-y-auto p-3 md:p-5 space-y-5" style={{ overscrollBehavior: "contain" }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center mb-5 shadow-lg">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Bishal's AI Assistant</h2>
                <p className="text-sm text-slate-500 max-w-sm mb-2">Ask anything — explanations, translations, problem solving, analysis.</p>
                <p className="text-xs text-slate-400 mb-6">ScorpStudy AI • Created by Bishal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-primary transition-colors text-slate-600 hover:text-primary font-medium">
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
                      <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white mt-0.5 shadow">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[88%] md:max-w-[80%] ${msg.role === "user"
                      ? "bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3"
                      : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <>
                          <div className="prose prose-sm max-w-none prose-strong:text-primary prose-strong:font-bold prose-h2:text-slate-800 prose-h2:text-sm prose-h2:font-bold prose-h3:text-slate-700 prose-h3:text-xs prose-li:text-slate-700 prose-p:text-slate-700 prose-p:leading-relaxed prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const isBlock = !!match || String(children).includes("\n");
                                  if (isBlock) {
                                    return (
                                      <SyntaxHighlighter
                                        style={oneDark}
                                        language={match ? match[1] : "text"}
                                        PreTag="div"
                                        customStyle={{ borderRadius: "10px", fontSize: "13px", margin: "8px 0" }}
                                      >
                                        {String(children).replace(/\n$/, "")}
                                      </SyntaxHighlighter>
                                    );
                                  }
                                  return <code className={className} {...props}>{children}</code>;
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-3">
                            <button onClick={() => copyMessage(msg.content)} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                            <button
                              onClick={() => handleVisualize(idx)}
                              disabled={visualLoading !== null}
                              className="flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-700 transition-colors disabled:opacity-40"
                            >
                              {visualLoading === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                              Visualize
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          {msg.attachmentName && (
                            <div className="flex items-center gap-1.5 mb-2 text-[11px] text-white/80 bg-white/10 rounded-lg px-2 py-1 w-fit">
                              <Paperclip className="w-3 h-3" />
                              {msg.attachmentName}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.content.replace(/\[Document:[^\]]*\]\n```[\s\S]*?```\n\n\*\*Question:\*\* /g, "")}
                          </div>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-600 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white mt-0.5 shadow">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-slate-400">{isTopperMode ? "Preparing topper answer..." : "Thinking..."}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input area */}
          <div className="border-t border-slate-100 bg-white p-3 space-y-2">
            {/* File attachment preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {attachedFile.kind === "image" ? (
                  <img src={attachedFile.thumbnail} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <span className="text-xs text-slate-600 font-medium flex-1 truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-500 transition-colors ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors bg-white"
                title="Attach image, PDF, or document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={
                  attachedFile?.kind === "image"
                    ? "What do you want to know about this image?"
                    : isTopperMode
                    ? "Ask anything — I'll give a complete topper-level answer..."
                    : "Ask your question... (Enter to send, Shift+Enter for new line)"
                }
                className="flex-1 resize-none min-h-[42px] max-h-32 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary"
                rows={1}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg self-end"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center px-0.5">
              <p className="text-[10px] text-slate-400">📎 Attach images or documents • Select text → Visual to generate diagram</p>
              {messages.length > 0 && !savedThisSession && (
                <p className="text-[10px] text-green-500">✓ Auto-saved to history</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
