import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateNote, useUpdateNote, useDeleteNote, useListNotes, useAiEnhanceNotes } from "@workspace/api-client-react";
import {
  BookOpen, Loader2, Save, Sparkles, Wand2, Search, Plus, Trash2, FileText,
  ArrowLeft, Eye, Edit3, Bold, Italic, List, ListOrdered, Quote, Code2,
  Download, ChevronDown, Star, StarOff, Heading1, Heading2, Check, Clock,
  Hash, AlignLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const NOTE_COLORS = [
  { id: "white", bg: "bg-white", border: "border-slate-200", dot: "bg-slate-300" },
  { id: "blue", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400" },
  { id: "green", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-400" },
  { id: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400" },
  { id: "purple", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400" },
  { id: "pink", bg: "bg-pink-50", border: "border-pink-200", dot: "bg-pink-400" },
];

const TEMPLATES: Record<string, { label: string; icon: string; content: string }> = {
  lecture: {
    label: "Lecture Notes",
    icon: "📚",
    content: `# Lecture Notes\n\n**Date:** ${format(new Date(), "MMMM d, yyyy")}\n**Subject:** \n**Topic:** \n\n---\n\n## 📌 Key Concepts\n\n\n\n## 💡 Examples\n\n\n\n## ❓ Questions\n\n\n\n## 📝 Summary\n\n`,
  },
  study: {
    label: "Study Guide",
    icon: "🎯",
    content: `# Study Guide\n\n**Topic:** \n**Exam Date:** \n\n---\n\n## Must Know\n- \n- \n- \n\n## Key Terms\n\n| Term | Definition |\n|------|------------|\n| | |\n\n## Important Formulas\n\n\n\n## Memory Tricks\n\n`,
  },
  cornell: {
    label: "Cornell Notes",
    icon: "📐",
    content: `# Cornell Notes\n\n**Date:** ${format(new Date(), "MMMM d, yyyy")}\n**Class:** \n\n---\n\n## Notes Column\n*(Main notes here — use bullet points)*\n\n\n\n## Cue Column\n*(Key questions & terms from your notes)*\n\n\n\n## Summary\n*(Write a 3-5 sentence summary after class)*\n\n`,
  },
  todo: {
    label: "Study To-Do",
    icon: "✅",
    content: `# Study To-Do List\n\n**Date:** ${format(new Date(), "MMMM d, yyyy")}\n\n---\n\n## 🔴 High Priority\n- [ ] \n- [ ] \n\n## 🟡 Medium Priority\n- [ ] \n- [ ] \n\n## 🟢 Low Priority\n- [ ] \n- [ ] \n\n## 📅 Upcoming Deadlines\n| Subject | Task | Due Date |\n|---------|------|----------|\n| | | |\n`,
  },
};

function loadNoteColors(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem("scorpstudy-note-colors") || "{}"); } catch { return {}; }
}
function saveNoteColors(colors: Record<number, string>) {
  localStorage.setItem("scorpstudy-note-colors", JSON.stringify(colors));
}
function loadPinned(): number[] {
  try { return JSON.parse(localStorage.getItem("scorpstudy-pinned-notes") || "[]"); } catch { return []; }
}
function savePinned(pins: number[]) {
  localStorage.setItem("scorpstudy-pinned-notes", JSON.stringify(pins));
}

export default function Notes() {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showTemplates, setShowTemplates] = useState(false);
  const [noteColors, setNoteColors] = useState(loadNoteColors);
  const [pinned, setPinned] = useState(loadPinned);
  const [aiLoading, setAiLoading] = useState<"enhance" | "summarize" | "quiz" | null>(null);
  const [quizModal, setQuizModal] = useState<{ questions: { question: string; options: string[]; correctAnswer: string }[] } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: notes, isLoading, refetch } = useListNotes(search ? { search } : undefined);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const enhanceNotes = useAiEnhanceNotes();

  const isEditing = selectedNoteId !== null;

  // Sort notes: pinned first, then by date
  const sortedNotes = notes ? [...notes].sort((a, b) => {
    const aPinned = pinned.includes(a.id) ? 1 : 0;
    const bPinned = pinned.includes(b.id) ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }) : [];

  useEffect(() => {
    if (selectedNoteId && notes) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) { setTitle(note.title); setContent(note.content); setSaveStatus("saved"); }
    }
  }, [selectedNoteId, notes]);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      await doSave(true);
    }, 1800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, selectedNoteId]);

  const doSave = async (silent = false) => {
    if (!title.trim() && !content.trim()) { setSaveStatus("saved"); return; }
    if (!title.trim()) {
      if (!silent) toast.error("Title is required");
      setSaveStatus("unsaved");
      return;
    }
    try {
      if (isEditing) {
        await updateNote.mutateAsync({ id: selectedNoteId, data: { title, content } });
      } else {
        const newNote = await createNote.mutateAsync({ data: { title, content } });
        setSelectedNoteId((newNote as { id: number }).id);
      }
      setSaveStatus("saved");
      if (!silent) toast.success(isEditing ? "Note updated!" : "Note created!");
      refetch();
    } catch {
      setSaveStatus("unsaved");
      if (!silent) toast.error("Failed to save note");
    }
  };

  const handleNew = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
    setSaveStatus("saved");
    setPreviewMode(false);
    setShowEditor(true);
  };

  const handleSelect = (id: number) => {
    setSelectedNoteId(id);
    setShowEditor(true);
    setPreviewMode(false);
  };

  const handleBack = () => setShowEditor(false);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote.mutateAsync({ id });
      if (selectedNoteId === id) { setSelectedNoteId(null); setTitle(""); setContent(""); setShowEditor(false); }
      toast.success("Note deleted");
      refetch();
    } catch { toast.error("Failed to delete note"); }
  };

  const handleAiAction = async (mode: "enhance" | "summarize") => {
    if (!content.trim()) { toast.error("Please enter some content first"); return; }
    setAiLoading(mode);
    try {
      const res = await enhanceNotes.mutateAsync({ data: { content, mode } });
      setContent(res.content);
      triggerAutoSave();
      toast.success(mode === "enhance" ? "✨ Notes enhanced by AI!" : "📝 Notes summarized!");
    } catch { toast.error("AI action failed"); }
    finally { setAiLoading(null); }
  };

  const handleGenerateQuiz = async () => {
    if (!content.trim()) { toast.error("Write some notes first"); return; }
    setAiLoading("quiz");
    try {
      const res = await fetch(`${BASE}/api/ai/notes-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.slice(0, 4000) }),
      });
      const data = await res.json();
      setQuizModal({ questions: data.questions || [] });
    } catch { toast.error("Failed to generate quiz"); }
    finally { setAiLoading(null); }
  };

  const applyTemplate = (key: string) => {
    if (content.trim() && !confirm("Apply template? This will replace current content.")) return;
    setContent(TEMPLATES[key].content);
    if (!title.trim()) setTitle(TEMPLATES[key].label);
    setShowTemplates(false);
    triggerAutoSave();
  };

  const setNoteColor = (id: number, color: string) => {
    const updated = { ...noteColors, [id]: color };
    setNoteColors(updated);
    saveNoteColors(updated);
  };

  const togglePin = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pinned.includes(id) ? pinned.filter(p => p !== id) : [...pinned, id];
    setPinned(updated);
    savePinned(updated);
  };

  const exportNote = () => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "note"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Formatting toolbar
  const insertFormat = (prefix: string, suffix = "", placeholder = "text") => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = content.slice(s, e) || placeholder;
    const newContent = content.slice(0, s) + prefix + sel + suffix + content.slice(e);
    setContent(newContent);
    triggerAutoSave();
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + prefix.length, s + prefix.length + sel.length);
    }, 0);
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readMins = Math.max(1, Math.ceil(words / 200));

  const noteColor = selectedNoteId ? (NOTE_COLORS.find(c => c.id === (noteColors[selectedNoteId] || "white")) ?? NOTE_COLORS[0]) : NOTE_COLORS[0];

  const NotesList = () => (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-pink-50 to-purple-50 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-pink-500" />
            Smart Notes
            {notes && <span className="text-[10px] font-normal text-slate-400 bg-white rounded-full px-2 py-0.5 border">{notes.length}</span>}
          </h2>
          <Button onClick={handleNew} size="sm" className="bg-pink-600 hover:bg-pink-700 h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> New Note
          </Button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search notes..." className="pl-8 h-8 text-xs bg-white border-slate-200" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
        ) : !sortedNotes.length ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-pink-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">{search ? "No matching notes" : "No notes yet"}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[160px]">{search ? "Try a different keyword" : "Click + New Note to start writing"}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedNotes.map(note => {
              const color = NOTE_COLORS.find(c => c.id === (noteColors[note.id] || "white")) ?? NOTE_COLORS[0];
              const isPinned = pinned.includes(note.id);
              const isActive = selectedNoteId === note.id;
              return (
                <div key={note.id} onClick={() => handleSelect(note.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all group border ${isActive ? `${color.bg} ${color.border} shadow-sm` : `hover:${color.bg} border-transparent hover:border-slate-200`}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isPinned && <span className="text-amber-400 text-[10px]">📌</span>}
                        <h4 className={`text-sm font-semibold truncate ${isActive ? "text-slate-900" : "text-slate-700"}`}>{note.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{note.content ? note.content.replace(/[#*`>[\]]/g, "").slice(0, 55) : "Empty note"}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => togglePin(note.id, e)} className="text-slate-300 hover:text-amber-400 transition-colors">
                        {isPinned ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={(e) => handleDelete(note.id, e)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Color dots */}
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {NOTE_COLORS.map(c => (
                      <button key={c.id} onClick={() => setNoteColor(note.id, c.id)}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-transform hover:scale-110 ${c.dot} ${noteColors[note.id] === c.id || (!noteColors[note.id] && c.id === "white") ? "border-slate-600 scale-110" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const Editor = () => (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden border-2 shadow-sm transition-colors ${noteColor.bg} ${noteColor.border}`}>
      {/* Editor header */}
      <div className={`p-3 border-b ${noteColor.border} ${noteColor.bg}`}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden shrink-0" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); triggerAutoSave(); }}
            placeholder="Note Title"
            className={`flex-1 text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent min-w-0 ${noteColor.bg}`}
          />
          {/* Save status */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            {saveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /><span>Saving...</span></>}
            {saveStatus === "saved" && <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Saved</span></>}
            {saveStatus === "unsaved" && <><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /><span>Unsaved</span></>}
          </div>
        </div>

        {/* Formatting toolbar */}
        {!previewMode && (
          <div className="flex items-center gap-0.5 flex-wrap">
            <button onClick={() => insertFormat("**", "**", "bold text")} title="Bold (Ctrl+B)" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("*", "*", "italic text")} title="Italic" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Italic className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("## ", "", "Heading")} title="H2" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Heading1 className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("### ", "", "Heading")} title="H3" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Heading2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("- ", "", "list item")} title="Bullet list" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><List className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("1. ", "", "list item")} title="Numbered list" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><ListOrdered className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("> ", "", "blockquote")} title="Quote" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Quote className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("`", "`", "code")} title="Inline code" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Code2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("| ", " | |\n| --- | --- |", "Header")} title="Table" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Hash className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("- [ ] ", "", "task")} title="Checkbox" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Check className="w-3.5 h-3.5" /></button>
            <div className="mx-1 w-px h-5 bg-slate-200" />
            {/* Templates */}
            <div className="relative">
              <button onClick={() => setShowTemplates(!showTemplates)} className="h-7 px-2 rounded hover:bg-white/70 flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors">
                <AlignLeft className="w-3.5 h-3.5" /> Template <ChevronDown className="w-3 h-3" />
              </button>
              {showTemplates && (
                <div className="absolute top-8 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[160px]">
                  {Object.entries(TEMPLATES).map(([key, t]) => (
                    <button key={key} onClick={() => applyTemplate(key)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {/* Write/Preview toggle */}
          <div className="flex bg-white/50 rounded-lg border border-slate-200 p-0.5">
            <button onClick={() => setPreviewMode(false)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${!previewMode ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-400 hover:text-slate-600"}`}>
              <Edit3 className="w-3 h-3" /> Write
            </button>
            <button onClick={() => setPreviewMode(true)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${previewMode ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-400 hover:text-slate-600"}`}>
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-pink-600 hover:bg-pink-50 gap-1" onClick={() => handleAiAction("enhance")} disabled={aiLoading !== null || !content.trim()}>
              {aiLoading === "enhance" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Enhance
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 gap-1" onClick={() => handleAiAction("summarize")} disabled={aiLoading !== null || !content.trim()}>
              {aiLoading === "summarize" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Summarize
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-violet-600 hover:bg-violet-50 gap-1" onClick={handleGenerateQuiz} disabled={aiLoading !== null || !content.trim()}>
              {aiLoading === "quiz" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              Quiz
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:bg-slate-100 gap-1" onClick={exportNote} disabled={!content.trim()}>
              <Download className="w-3 h-3" /> Export
            </Button>
            <Button size="sm" className="h-7 text-xs bg-pink-600 hover:bg-pink-700 gap-1" onClick={() => doSave()} disabled={createNote.isPending || updateNote.isPending}>
              {(createNote.isPending || updateNote.isPending) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-hidden relative">
        {previewMode ? (
          <div className={`h-full overflow-y-auto p-5 prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-blockquote:border-pink-300 prose-blockquote:text-slate-600 ${noteColor.bg}`}>
            {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p className="text-slate-300 italic">Nothing to preview yet. Switch to Write mode and start typing.</p>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); triggerAutoSave(); }}
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) {
                if (e.key === "b") { e.preventDefault(); insertFormat("**", "**", "bold"); }
                if (e.key === "i") { e.preventDefault(); insertFormat("*", "*", "italic"); }
                if (e.key === "s") { e.preventDefault(); doSave(); }
              }
            }}
            placeholder={`Start writing your notes...\n\nTips:\n• Use ## for headings, **text** for bold, *text* for italic\n• Use the toolbar above for quick formatting\n• Ctrl+S to save, Ctrl+B for bold, Ctrl+I for italic\n• Click 'Template' to start with a structured format`}
            className={`w-full h-full resize-none border-none outline-none p-5 text-sm leading-relaxed font-mono bg-transparent text-slate-800 placeholder:text-slate-300`}
          />
        )}
      </div>

      {/* Footer with stats */}
      <div className={`px-5 py-2 border-t ${noteColor.border} flex items-center justify-between text-[11px] text-slate-400 ${noteColor.bg}`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><AlignLeft className="w-3 h-3" /> {words} words</span>
          <span>{chars} chars</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{readMins} min read</span>
        </div>
        {selectedNoteId && notes && (
          <span>{format(new Date(notes.find(n => n.id === selectedNoteId)?.updatedAt ?? new Date()), "MMM d, h:mm a")}</span>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Quiz Modal */}
      {quizModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQuizModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-violet-600" /> Quiz from your Notes</h2>
              <Button variant="ghost" size="icon" onClick={() => setQuizModal(null)}><ArrowLeft className="w-4 h-4" /></Button>
            </div>
            <div className="p-5 space-y-4">
              {quizModal.questions.map((q, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <p className="font-semibold text-sm text-slate-800 mb-3"><span className="text-violet-500 mr-1">{i + 1}.</span>{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, j) => (
                      <div key={j} className={`text-xs px-3 py-2 rounded-lg border ${opt === q.correctAnswer ? "bg-green-50 border-green-300 text-green-800 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>
                        {opt} {opt === q.correctAnswer && "✓"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: side-by-side */}
      <div className="hidden md:flex gap-4 h-[calc(100vh-5rem)]">
        <div className="w-72 shrink-0"><NotesList /></div>
        <div className="flex-1">
          {showEditor || selectedNoteId !== null ? <Editor /> : (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-20 h-20 rounded-2xl bg-pink-50 flex items-center justify-center mb-5">
                <BookOpen className="w-10 h-10 text-pink-300" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-2">Select a note or create a new one</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-xs">AI-powered notes with markdown support, auto-save, templates, and more.</p>
              <Button onClick={handleNew} className="bg-pink-600 hover:bg-pink-700 gap-2">
                <Plus className="w-4 h-4" /> Create New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden h-[calc(100vh-5rem)]">
        {showEditor ? <Editor /> : <NotesList />}
      </div>
    </DashboardLayout>
  );
}
