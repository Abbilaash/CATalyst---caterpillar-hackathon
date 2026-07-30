import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PageContainer({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-200">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-500/50 text-ink-200">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink-50">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-200">{description}</p>}
    </div>
  );
}
