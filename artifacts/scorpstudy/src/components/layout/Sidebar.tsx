import { Link, useLocation } from "wouter";
import { MessageSquare, FileText, CheckSquare, Layers, Image as ImageIcon, BookOpen, Clock, LayoutDashboard, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "Bishal's Assistant", icon: MessageSquare },
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
    <nav className="space-y-0.5 mt-4 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const Logo = () => (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <img src="/logo.png" alt="ScorpStudy" className="w-9 h-9 object-contain shrink-0" />
      <div className="leading-tight min-w-0">
        <span className="text-sm font-bold text-slate-900 block truncate">ScorpStudy</span>
        <span className="text-xs text-primary font-semibold block">by Bishal</span>
      </div>
    </Link>
  );

  const UserFooter = () => (
    <div className="p-3 border-t border-slate-100 space-y-1">
      {user && <p className="text-[11px] text-slate-400 truncate px-2">{user.email}</p>}
      <Button variant="ghost" size="sm" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs" onClick={signOut}>
        <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn("hidden md:flex flex-col w-60 border-r border-slate-200 bg-white min-h-screen fixed left-0 top-0 z-30", className)}>
        <div className="p-4 border-b border-slate-100">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserFooter />
      </aside>

      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50 bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <Logo />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <UserFooter />
        </SheetContent>
      </Sheet>
    </>
  );
}
