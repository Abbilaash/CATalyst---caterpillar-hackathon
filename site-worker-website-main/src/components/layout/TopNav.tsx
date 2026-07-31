import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface TopNavProps {
  onMenuClick: () => void;
}

const notifications = [
  { id: 1, title: 'Engine overheating', body: 'CAT 320 Excavator — cooling system alert', time: '12m ago', tone: 'danger' },
  { id: 2, title: 'Maintenance overdue', body: 'CAT 14M3 Grader — 1000-hr service overdue', time: '1h ago', tone: 'warning' },
  { id: 3, title: 'Task completed', body: 'Utility trench — Line 4 marked complete', time: '3h ago', tone: 'success' },
  { id: 4, title: 'New equipment assigned', body: 'CAT 349F2 mobilized to Highland Ridge', time: '5h ago', tone: 'info' },
];

const toneDot: Record<string, string> = {
  danger: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-info',
};

export function TopNav({ onMenuClick }: TopNavProps) {
  const navigate = useNavigate();
  const email = localStorage.getItem('site-manager-email') || 'manager@caterpillar.com';
  const signOut = () => {
    localStorage.removeItem('site-manager-token');
    localStorage.removeItem('site-manager-email');
    window.dispatchEvent(new Event('site-manager-sign-out'));
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Global search */}
      <div className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search machines, operators, tasks..."
          className="h-9 border-border bg-accent/50 pl-9 pr-16 text-sm placeholder:text-muted-foreground focus-visible:bg-accent"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 border-border bg-popover p-0"
            sideOffset={8}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {notifications.length} new
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-0 hover:bg-accent/50"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', toneDot[n.tone])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-primary/10">
              View all notifications
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-accent/40 py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-accent">
              <img
                src="https://i.pravatar.cc/150?img=68"
                alt="Profile"
                className="h-7 w-7 rounded-md object-cover ring-1 ring-border"
              />
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-semibold text-foreground">Site Manager</p>
                <p className="text-[10px] text-muted-foreground">Site Manager</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-popover" sideOffset={8}>
            <DropdownMenuLabel className="flex items-center gap-2.5">
              <img
                src="https://i.pravatar.cc/150?img=68"
                alt="Profile"
                className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">Site Manager</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
