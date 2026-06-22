import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAiChat, useCreateChat, useListChats } from "@workspace/api-client-react";
import { MessageSquare, Plus, Save, Send, Copy, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatAi = useAiChat();
  const saveChat = useCreateChat();
  const { refetch: refetchChats } = useListChats();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatAi.isPending]);

  const handleSend = async () => {
    if (!input.trim() || chatAi.isPending) return;
    
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    
    try {
      const response = await chatAi.mutateAsync({ data: { messages: newMessages } });
      setMessages([...newMessages, { role: "assistant", content: response.content }]);
    } catch (error) {
      toast.error("Failed to get response");
    }
  };

  const handleSave = async () => {
    if (messages.length === 0) {
      toast.error("No messages to save");
      return;
    }
    
    try {
      await saveChat.mutateAsync({ 
        data: { 
          title: messages[0].content.substring(0, 50) + "...", 
          messages 
        } 
      });
      toast.success("Chat saved");
      refetchChats();
    } catch (error) {
      toast.error("Failed to save chat");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            AI Chat Tutor
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMessages([])} className="text-slate-600">
              <Plus className="w-4 h-4 mr-2" /> New Chat
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} className="text-slate-600" disabled={messages.length === 0 || saveChat.isPending}>
              {saveChat.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-slate-700">How can I help you study?</h2>
                <p>Ask me to explain a concept, solve a problem, or test your knowledge on any subject.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                    {msg.role === 'assistant' && (
                      <button 
                        onClick={() => handleCopy(msg.content)}
                        className="mt-3 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-xs"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-600 mt-1">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))
            )}
            {chatAi.isPending && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white mt-1">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask your study question... (Shift+Enter for new line)"
                className="pr-12 resize-none min-h-[60px] max-h-32 bg-slate-50 border-slate-200 focus-visible:ring-primary"
                rows={2}
              />
              <Button 
                size="icon" 
                className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
                onClick={handleSend}
                disabled={!input.trim() || chatAi.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
