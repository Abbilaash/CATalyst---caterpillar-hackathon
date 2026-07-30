import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger' | 'success';

const variants: Record<Variant, string> = {
  primary: 'bg-cat-yellow text-ink-900 hover:bg-cat-yellow-soft',
  ghost: 'text-ink-100 hover:bg-white/5',
  outline: 'border border-white/10 text-ink-100 hover:bg-white/5',
  danger: 'bg-crit/15 text-crit hover:bg-crit/25 border border-crit/20',
  success: 'bg-ok/15 text-ok hover:bg-ok/25 border border-ok/20',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${variants[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

export function IconButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-100 transition-colors hover:bg-white/5 ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
