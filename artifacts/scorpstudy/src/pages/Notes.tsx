import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNote, useUpdateNote, useDeleteNote, useListNotes, useAiEnhanceNotes } from "@workspace/api-client-react";
import { BookOpen, Loader2, Save, Sparkles, Wand2, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Notes() {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  
  const { data: notes, isLoading, refetch } = useListNotes({ search: search || undefined });
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const enhanceNotes = useAiEnhanceNotes();

  const isEditing = selectedNoteId !== null;

  useEffect(() => {
    if (selectedNoteId && notes) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      }
    }
  }, [selectedNoteId, notes]);

  const handleNew = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    try {
      if (isEditing) {
        await updateNote.mutateAsync({ id: selectedNoteId, data: { title, content } });
        toast.success("Note updated");
      } else {
        const newNote = await createNote.mutateAsync({ data: { title, content } });
        setSelectedNoteId(newNote.id);
        toast.success("Note created");
      }
      refetch();
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;
    
    try {
      await deleteNote.mutateAsync({ id });
      if (selectedNoteId === id) handleNew();
      toast.success("Note deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleAiAction = async (mode: "enhance" | "summarize") => {
    if (!content.trim()) {
      toast.error("Please enter some content first");
      return;
    }
    
    try {
      const res = await enhanceNotes.mutateAsync({ data: { content, mode } });
      setContent(res.content);
      toast.success(`Note ${mode === 'enhance' ? 'enhanced' : 'summarized'}!`);
    } catch (error) {
      toast.error("AI action failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-72 flex flex-col border border-slate-200 bg-white rounded-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <Button onClick={handleNew} className="w-full bg-pink-600 hover:bg-pink-700" size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Note
            </Button>
            <div className="relative mt-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input 
                placeholder="Search notes..." 
                className="pl-9 h-9 text-sm bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : notes?.length === 0 ? (
              <div className="text-center p-4 text-sm text-slate-500">No notes found</div>
            ) : (
              <div className="space-y-1">
                {notes?.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group flex justify-between items-start ${selectedNoteId === note.id ? 'bg-pink-50 border border-pink-100' : 'hover:bg-slate-50 border border-transparent'}`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className={`text-sm font-medium truncate ${selectedNoteId === note.id ? 'text-pink-900' : 'text-slate-700'}`}>{note.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(note.updatedAt), 'MMM d, yyyy')}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-6 w-6 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity`}
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

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleAiAction("enhance")} disabled={enhanceNotes.isPending || !content.trim()} title="Fix grammar and improve flow">
                {enhanceNotes.isPending && enhanceNotes.variables?.data.mode === 'enhance' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-pink-500" />}
                Enhance
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAiAction("summarize")} disabled={enhanceNotes.isPending || !content.trim()} title="Make it concise">
                {enhanceNotes.isPending && enhanceNotes.variables?.data.mode === 'summarize' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2 text-indigo-500" />}
                Summarize
              </Button>
              <Button size="sm" onClick={handleSave} disabled={createNote.isPending || updateNote.isPending} className="bg-slate-900">
                {(createNote.isPending || updateNote.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your notes here..."
            className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 p-6 text-base leading-relaxed"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
