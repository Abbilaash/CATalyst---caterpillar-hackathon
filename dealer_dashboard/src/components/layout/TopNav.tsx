import { Bell, Menu, Search, ChevronDown } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function TopNav({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.04] bg-ink-800/80 px-4 backdrop-blur-xl lg:px-8">
      <IconButton className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </IconButton>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-200" />
        <input
          type="text"
          placeholder="Search equipment, sites, operators..."
          className="w-full rounded-lg border border-white/[0.06] bg-ink-600/60 py-2 pl-10 pr-4 text-sm text-ink-50 placeholder:text-ink-200 focus:border-cat-yellow/40 focus:outline-none focus:ring-1 focus:ring-cat-yellow/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge tone="ok" dot className="hidden md:inline-flex">
          All Systems Operational
        </Badge>
        <IconButton className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cat-yellow ring-2 ring-ink-800" />
        </IconButton>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cat-yellow to-cat-yellow-dark text-xs font-bold text-ink-900">
            JD
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-ink-50">Jordan Diaz</div>
            <div className="text-[10px] text-ink-200">Regional Dealer</div>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-ink-200 sm:block" />
        </button>
      </div>
    </header>
  );
}
