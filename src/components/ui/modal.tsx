'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
  title?: React.ReactNode;
}

export function Modal({ open, onClose, children, className, fullscreen, title }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 28, scale: fullscreen ? 0.98 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: fullscreen ? 0.98 : 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'gradient-border-card relative flex flex-col overflow-hidden rounded-2xl border border-white/5 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.8),0_0_60px_-24px_rgba(227,6,19,0.4)] sm:rounded-3xl',
              fullscreen
                ? 'size-full sm:size-auto sm:max-h-[84vh] sm:w-[min(92vw,1120px)]'
                : 'w-[92vw] max-w-md',
              className,
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#ff2735]/70 to-transparent" />
            {title && (
              <div className="flex items-center justify-between border-b border-line/80 px-6 py-4">
                <div className="text-base font-bold text-ink">{title}</div>
                <ModalClose onClose={onClose} />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ModalClose({ onClose, className }: { onClose: () => void; className?: string }) {
  return (
    <button
      onClick={onClose}
      className={cn(
        'glass inline-flex size-9 items-center justify-center rounded-xl border border-line text-ink-muted transition-all duration-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400',
        className,
      )}
      aria-label="Cerrar"
    >
      <X className="size-4" />
    </button>
  );
}