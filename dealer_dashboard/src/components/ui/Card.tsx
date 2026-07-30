import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function Card({
  children,
  className = '',
  hover = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-6 pt-5 pb-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink-50">{title}</h3>
          {subtitle && <p className="text-xs text-ink-200 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
