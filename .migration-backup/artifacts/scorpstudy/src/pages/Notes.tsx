import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateNote, useUpdateNote, useDeleteNote, useListNotes, useAiEnhanceNotes } from "@workspace/api-client-react";
import {
  BookOpen, Loader2, Save, Sparkles, Wand2, Search, Plus, Trash2, FileText,
  ArrowLeft, Eye, Edit3, Bold, Italic, Download, ChevronDown, Star, StarOff,
  AlignLeft, Clock, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const NOTE_COLORS = [
  { id: "white",  bg: "bg-white",       border: "border-slate-200",  dot: "bg-slate-300" },
  { id: "blue",   bg: "bg-blue-50",     border: "border-blue-200",   dot: "bg-blue-400" },
  { id: "green",  bg: "bg-green-50",    border: "border-green-200",  dot: "bg-green-400" },
  { id: "yellow", bg: "bg-yellow-50",   border: "border-yellow-200", dot: "bg-yellow-400" },
  { id: "purple", bg: "bg-purple-50",   border: "border-purple-200", dot: "bg-purple-400" },
  { id: "pink",   bg: "bg-pink-50",     border: "border-pink-200",   dot: "bg-pink-400" },
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

// Student-focused smart inserts (replaces basic markdown toolbar)
const SMART_INSERTS = [
  {
    id: "important",
    label: "Important",
    emoji: "📌",
    title: "Mark as Important",
    insert: () => `\n\n> 📌 **Important:** `,
  },
  {
    id: "keyconcept",
    label: "Key Concept",
    emoji: "💡",
    title: "Key Concept block",
    insert: () => `\n\n> 💡 **Key Concept:** `,
  },
  {
    id: "question",
    label: "Study Q",
    emoji: "❓",
    title: "Self-study question",
    insert: () => `\n\n> ❓ **Study Question:** \n> 📝 *Answer:* `,
  },
  {
    id: "definition",
    label: "Definition",
    emoji: "📖",
    title: "Term definition",
    insert: () => `\n\n> 📖 **Definition — :** \n> `,
  },
  {
    id: "formula",
    label: "Formula",
    emoji: "🔢",
    title: "Math / formula block",
    insert: () => `\n\n**Formula:**\n\`\`\`\n\n\`\`\`\n`,
  },
  {
    id: "date",
    label: "Date",
    emoji: "📅",
    title: "Insert today's date",
    insert: () => `📅 *${format(new Date(), "MMMM d, yyyy")}* `,
  },
  {
    id: "table",
    label: "Table",
    emoji: "📊",
    title: "Insert comparison table",
    insert: () => `\n\n| Concept | Description | Example |\n|---------|-------------|--------|\n| | | |\n| | | |\n`,
  },
  {
    id: "task",
    label: "Task",
    emoji: "✅",
    title: "Add task / checklist item",
    insert: () => `\n- [ ] `,
  },
];

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

/** Confirmation dialog component */
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full border-2 border-red-100" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 ring-4 ring-red-50">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-extrabold text-red-600 mb-2">Are you sure?</h3>
          <p className="text-base font-bold text-red-500 mb-2">Do you want to delete this?</p>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          <p className="text-xs text-red-400 font-medium mt-3 bg-red-50 px-3 py-1.5 rounded-full">⚠️ This action cannot be undone</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 gap-1 border-slate-200">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 gap-1 font-bold">
            <Trash2 className="w-4 h-4" /> Yes, Delete
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Stale-closure fix: keep a ref that always points to the latest doSave ---
  const latestSaveStateRef = useRef({ title, content, selectedNoteId });
  useEffect(() => {
    latestSaveStateRef.current = { title, content, selectedNoteId };
  });

  const { data: notes, isLoading, refetch } = useListNotes(search ? { search } : undefined);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const enhanceNotes = useAiEnhanceNotes();

  const isEditing = selectedNoteId !== null;

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

  /**
   * doSave — reads from the ref so it always operates on the LATEST state,
   * even when called from inside a stale setTimeout closure.
   */
  const doSave = useCallback(async (silent = false) => {
    const { title: t, content: c, selectedNoteId: sid } = latestSaveStateRef.current;
    if (!t.trim() && !c.trim()) { setSaveStatus("saved"); return; }
    if (!t.trim()) {
      if (!silent) toast.error("Title is required");
      setSaveStatus("unsaved");
      return;
    }
    try {
      if (sid !== null) {
        await updateNote.mutateAsync({ id: sid, data: { title: t, content: c } });
      } else {
        const newNote = await createNote.mutateAsync({ data: { title: t, content: c } });
        setSelectedNoteId((newNote as { id: number }).id);
        setShowEditor(true);
      }
      setSaveStatus("saved");
      if (!silent) toast.success(sid !== null ? "Note updated!" : "Note created!");
      refetch();
    } catch {
      setSaveStatus("unsaved");
      if (!silent) toast.error("Failed to save note");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      await doSave(true);
    }, 1800);
  }, [doSave]);

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

  const handleDeleteRequest = (id: number, noteTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete({ id, title: noteTitle });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
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
    // Auto-generate a title if missing so the note can be saved after AI action
    if (!title.trim()) {
      const autoTitle = content.trim().split("\n")[0].replace(/^[#\s*_]+/, "").slice(0, 60) || `My Note — ${format(new Date(), "MMM d")}`;
      setTitle(autoTitle);
    }
    try {
      const res = await enhanceNotes.mutateAsync({ data: { content, mode } });
      setContent(res.content);
      setSaveStatus("unsaved");
      toast.success(mode === "enhance" ? "✨ Notes enhanced by AI!" : "📝 Notes summarized!");
      // Immediately save so the note appears in the list
      setTimeout(async () => {
        setSaveStatus("saving");
        await doSave(true);
      }, 100);
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

  const exportNoteToPdf = async () => {
    if (!title.trim() && !content.trim()) { toast.error("Nothing to export"); return; }
    toast.info("Generating PDF…");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = 210, pageH = 297;
      const marginX = 18, marginY = 22, maxW = pageW - marginX * 2;
      let y = marginY;

      const brand = "ScorpStudy — Smart Notes";
      doc.setFontSize(8);
      doc.setTextColor(124, 58, 237);
      doc.setFont("helvetica", "bold");
      doc.text(brand.toUpperCase(), marginX, y);
      y += 7;

      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(0.6);
      doc.line(marginX, y, pageW - marginX, y);
      y += 6;

      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(title || "Untitled Note", maxW);
      doc.text(titleLines, marginX, y);
      y += titleLines.length * 8 + 4;

      const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(`Exported on ${now}`, marginX, y);
      y += 10;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageW - marginX, y);
      y += 8;

      const lines = content.split("\n");
      for (const raw of lines) {
        if (y > pageH - 25) {
          doc.addPage();
          y = marginY;
        }
        const line = raw.trimEnd();
        if (/^# /.test(line)) {
          doc.setFontSize(15); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
          const t = doc.splitTextToSize(line.replace(/^# /, ""), maxW);
          doc.text(t, marginX, y); y += t.length * 7 + 3;
        } else if (/^## /.test(line)) {
          doc.setFontSize(12); doc.setTextColor(30, 41, 59); doc.setFont("helvetica", "bold");
          const t = doc.splitTextToSize(line.replace(/^## /, ""), maxW);
          doc.text(t, marginX, y); y += t.length * 6 + 2;
        } else if (/^### /.test(line)) {
          doc.setFontSize(10); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "bold");
          const t = doc.splitTextToSize(line.replace(/^### /, ""), maxW);
          doc.text(t, marginX, y); y += t.length * 5.5 + 2;
        } else if (/^```/.test(line)) {
          doc.setFontSize(8.5); doc.setTextColor(226, 232, 240); doc.setFont("courier", "normal");
          doc.setFillColor(30, 41, 59);
        } else if (/^- /.test(line) || /^\d+\. /.test(line)) {
          doc.setFontSize(9.5); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal");
          const bullet = /^- /.test(line) ? "•  " : `${line.match(/^\d+/)?.[0] ?? "1"}.  `;
          const text = line.replace(/^- /, "").replace(/^\d+\. /, "");
          const t = doc.splitTextToSize(bullet + text, maxW - 5);
          doc.text(t, marginX + 3, y); y += t.length * 5 + 1;
        } else if (/^> /.test(line)) {
          doc.setFontSize(9); doc.setTextColor(76, 29, 149); doc.setFont("helvetica", "bolditalic");
          const t = doc.splitTextToSize(line.replace(/^> /, ""), maxW - 8);
          doc.setFillColor(250, 245, 255);
          doc.roundedRect(marginX, y - 4, maxW, t.length * 5 + 4, 2, 2, "F");
          doc.text(t, marginX + 4, y); y += t.length * 5 + 4;
        } else if (line.trim() === "") {
          y += 3;
        } else {
          doc.setFontSize(10); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal");
          const plain = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
          const t = doc.splitTextToSize(plain, maxW);
          doc.text(t, marginX, y); y += t.length * 5.5 + 1;
        }
      }

      if (y > pageH - 18) { doc.addPage(); y = pageH - 14; }
      else { y = pageH - 12; }
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
      doc.line(marginX, y - 3, pageW - marginX, y - 3);
      doc.setFontSize(7.5); doc.setTextColor(148, 163, 184); doc.setFont("helvetica", "normal");
      doc.text("ScorpStudy by Bishal Bishwokarma", marginX, y + 2);
      doc.text(now, pageW - marginX, y + 2, { align: "right" });

      const fileName = `${(title || "note").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      doc.save(fileName);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("PDF export failed. Please try again.");
    }
  };

  const insertFormat = (prefix: string, suffix = "", placeholder = "text") => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = content.slice(s, e) || placeholder;
    const newContent = content.slice(0, s) + prefix + sel + suffix + content.slice(e);
    setContent(newContent);
    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => { setSaveStatus("saving"); await doSave(true); }, 1800);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + prefix.length, s + prefix.length + sel.length);
    }, 0);
  };

  const insertSmartBlock = (insertFn: () => string) => {
    const el = textareaRef.current;
    const text = insertFn();
    if (!el) {
      setContent(prev => prev + text);
      triggerAutoSave();
      return;
    }
    const pos = el.selectionStart;
    const newContent = content.slice(0, pos) + text + content.slice(pos);
    setContent(newContent);
    triggerAutoSave();
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(pos + text.length, pos + text.length);
    }, 0);
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readMins = Math.max(1, Math.ceil(words / 200));

  const noteColor = selectedNoteId
    ? (NOTE_COLORS.find(c => c.id === (noteColors[selectedNoteId] || "white")) ?? NOTE_COLORS[0])
    : NOTE_COLORS[0];

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
                      <button onClick={(e) => handleDeleteRequest(note.id, note.title, e)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            {saveStatus === "saving"  && <><Loader2 className="w-3 h-3 animate-spin" /><span>Saving...</span></>}
            {saveStatus === "saved"   && <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Saved</span></>}
            {saveStatus === "unsaved" && <><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /><span>Unsaved</span></>}
          </div>
        </div>

        {/* ── Smart student toolbar (replaces old H1/H2/list/quote/code toolbar) ── */}
        {!previewMode && (
          <div className="flex items-center gap-0.5 flex-wrap mb-2">
            {/* Keep Bold & Italic — universal essentials */}
            <button onClick={() => insertFormat("**", "**", "bold text")} title="Bold (Ctrl+B)" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormat("*", "*", "italic text")} title="Italic (Ctrl+I)" className="h-7 w-7 rounded hover:bg-white/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"><Italic className="w-3.5 h-3.5" /></button>

            <div className="mx-1 w-px h-5 bg-slate-200" />

            {/* Smart student inserts */}
            {SMART_INSERTS.map(si => (
              <button
                key={si.id}
                onClick={() => insertSmartBlock(si.insert)}
                title={si.title}
                className="h-7 px-1.5 rounded hover:bg-white/70 flex items-center gap-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>{si.emoji}</span>
                <span className="hidden sm:inline">{si.label}</span>
              </button>
            ))}

            <div className="mx-1 w-px h-5 bg-slate-200" />

            {/* Templates dropdown */}
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
        <div className="flex items-center gap-2 flex-wrap">
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
              Quiz Me
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:bg-slate-100 gap-1" onClick={exportNoteToPdf} disabled={!content.trim()}>
              <Download className="w-3 h-3" /> Export to PDF
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
            {content
              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              : <p className="text-slate-300 italic">Nothing to preview yet. Switch to Write mode and start typing.</p>}
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
            placeholder={`Start writing your notes here...\n\nPro tips:\n• Use the smart toolbar above to insert key concepts, important callouts, formulas, tables & tasks\n• Click "Template" for pre-built Lecture, Cornell, Study Guide formats\n• Ctrl+S saves · Ctrl+B bold · Ctrl+I italic\n• Switch to Preview to see your formatted notes rendered beautifully`}
            className={`w-full h-full resize-none border-none outline-none p-5 text-sm leading-relaxed font-mono bg-transparent text-slate-800 placeholder:text-slate-300`}
          />
        )}
      </div>

      {/* Footer with stats */}
      <div className={`px-5 py-2 border-t ${noteColor.border} flex items-center justify-between text-[11px] text-slate-400 ${noteColor.bg}`}>
        <div className="flex items-center gap-4">
          <span>{words} words</span>
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
      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message={`Do you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

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
        <div className="w-72 shrink-0">{NotesList()}</div>
        <div className="flex-1">
          {showEditor || selectedNoteId !== null ? Editor() : (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-20 h-20 rounded-2xl bg-pink-50 flex items-center justify-center mb-5">
                <BookOpen className="w-10 h-10 text-pink-300" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-2">Select a note or create a new one</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-xs">Smart notes with AI enhance, summaries, quiz generation, templates and more.</p>
              <Button onClick={handleNew} className="bg-pink-600 hover:bg-pink-700 gap-2">
                <Plus className="w-4 h-4" /> Create New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden h-[calc(100vh-5rem)]">
        {showEditor ? Editor() : NotesList()}
      </div>
    </DashboardLayout>
  );
}
