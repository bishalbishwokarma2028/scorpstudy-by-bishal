import { Link, useLocation } from "wouter";
import { MessageSquare, FileText, CheckSquare, Layers, Image as ImageIcon, BookOpen, Clock, LayoutDashboard, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "AI Chat Tutor", icon: MessageSquare },
  { href: "/dashboard/summarizer", label: "Summarizer", icon: FileText },
  { href: "/dashboard/quiz", label: "Quiz Generator", icon: CheckSquare },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers },
  { href: "/dashboard/image-gen", label: "Image Gen", icon: ImageIcon },
  { href: "/dashboard/notes", label: "Smart Notes", icon: BookOpen },
  { href: "/dashboard/history", label: "History", icon: Clock },
];

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const NavLinks = () => (
    <nav className="space-y-1 mt-6 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const Logo = () => (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">S</div>
      <div className="leading-tight">
        <span className="text-base font-bold text-slate-900 tracking-tight block">ScorpStudy</span>
        <span className="text-xs text-primary font-medium block -mt-0.5">by Bishal</span>
      </div>
    </Link>
  );

  return (
    <>
      <aside className={cn("hidden md:flex flex-col w-64 border-r border-slate-200 bg-white min-h-screen fixed left-0 top-0", className)}>
        <div className="p-4 border-b border-slate-100">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-slate-100 space-y-2">
          {user && (
            <p className="text-xs text-slate-500 truncate px-1">{user.email}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <Logo />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="p-4 border-t border-slate-100 space-y-2">
            {user && (
              <p className="text-xs text-slate-500 truncate px-1">{user.email}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
