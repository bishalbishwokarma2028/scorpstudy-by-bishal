import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNote, useUpdateNote, useDeleteNote, useListNotes, useAiEnhanceNotes } from "@workspace/api-client-react";
import { BookOpen, Loader2, Save, Sparkles, Wand2, Search, Plus, Trash2, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Notes() {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const { data: notes, isLoading, refetch } = useListNotes(search ? { search } : undefined);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const enhanceNotes = useAiEnhanceNotes();

  const isEditing = selectedNoteId !== null;

  useEffect(() => {
    if (selectedNoteId && notes) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) { setTitle(note.title); setContent(note.content); }
    }
  }, [selectedNoteId, notes]);

  const handleNew = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
    setShowEditor(true);
  };

  const handleSelect = (id: number) => {
    setSelectedNoteId(id);
    setShowEditor(true);
  };

  const handleBack = () => {
    setShowEditor(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    try {
      if (isEditing) {
        await updateNote.mutateAsync({ id: selectedNoteId, data: { title, content } });
        toast.success("Note updated");
      } else {
        const newNote = await createNote.mutateAsync({ data: { title, content } });
        setSelectedNoteId((newNote as { id: number }).id);
        toast.success("Note created!");
      }
      refetch();
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote.mutateAsync({ id });
      if (selectedNoteId === id) { setSelectedNoteId(null); setTitle(""); setContent(""); setShowEditor(false); }
      toast.success("Note deleted");
      refetch();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleAiAction = async (mode: "enhance" | "summarize") => {
    if (!content.trim()) { toast.error("Please enter some content first"); return; }
    try {
      const res = await enhanceNotes.mutateAsync({ data: { content, mode } });
      setContent(res.content);
      toast.success(mode === "enhance" ? "Notes enhanced by AI!" : "Notes summarized by AI!");
    } catch {
      toast.error("AI action failed");
    }
  };

  const NotesList = () => (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* List header */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-pink-500" />
            Smart Notes
          </h2>
          <Button onClick={handleNew} size="sm" className="bg-pink-600 hover:bg-pink-700 h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Note
          </Button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search notes..."
            className="pl-8 h-8 text-xs bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {/* List body */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : !notes?.length ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500 font-medium">{search ? "No matching notes" : "No notes yet"}</p>
            <p className="text-xs text-slate-400 mt-1">{search ? "Try a different search" : "Click + New Note to get started"}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => handleSelect(note.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors group flex justify-between items-start border ${selectedNoteId === note.id ? "bg-pink-50 border-pink-200" : "border-transparent hover:bg-slate-50 hover:border-slate-200"}`}
              >
                <div className="min-w-0 pr-2 flex-1">
                  <h4 className={`text-sm font-medium truncate ${selectedNoteId === note.id ? "text-pink-800" : "text-slate-700"}`}>{note.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{format(new Date(note.updatedAt), "MMM d, yyyy")}</p>
                  {note.content && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{note.content.slice(0, 60)}</p>
                  )}
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => handleDelete(note.id, e)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const Editor = () => (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Editor header */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden shrink-0" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="flex-1 text-base font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent min-w-0"
        />
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAiAction("enhance")} disabled={enhanceNotes.isPending || !content.trim()}>
            {enhanceNotes.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1 text-pink-500" />}
            Enhance
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAiAction("summarize")} disabled={enhanceNotes.isPending || !content.trim()}>
            {enhanceNotes.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1 text-indigo-500" />}
            Summarize
          </Button>
          <Button size="sm" className="h-7 text-xs bg-pink-600 hover:bg-pink-700" onClick={handleSave} disabled={createNote.isPending || updateNote.isPending}>
            {(createNote.isPending || updateNote.isPending) ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your notes here...&#10;&#10;Tip: Use the AI buttons above to enhance or summarize your notes."
        className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 p-4 text-sm leading-relaxed"
      />
    </div>
  );

  return (
    <DashboardLayout>
      {/* Desktop: side-by-side */}
      <div className="hidden md:flex gap-4 h-[calc(100vh-6rem)]">
        <div className="w-72 shrink-0"><NotesList /></div>
        <div className="flex-1">
          {showEditor || selectedNoteId !== null ? (
            <Editor />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-xl">
              <FileText className="w-14 h-14 text-slate-200 mb-4" />
              <h3 className="text-base font-semibold text-slate-600 mb-2">Select a note or create a new one</h3>
              <p className="text-sm text-slate-400 mb-5 max-w-xs">Your notes will appear here. AI can enhance or summarize them.</p>
              <Button onClick={handleNew} className="bg-pink-600 hover:bg-pink-700 gap-2">
                <Plus className="w-4 h-4" /> Create New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: toggle between list and editor */}
      <div className="md:hidden h-[calc(100vh-5rem)]">
        {showEditor ? <Editor /> : <NotesList />}
      </div>
    </DashboardLayout>
  );
}
