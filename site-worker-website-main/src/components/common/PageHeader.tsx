import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  backTo,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex items-start gap-3">
        {backTo && (
          <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{backLabel}</span>
            </Link>
          </Button>
        )}
        {icon && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            {icon}
          </div>
        )}
        <div>
          {backTo && (
            <Link
              to={backTo}
              className="mb-1 hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              {backLabel}
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
