"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@tasheen/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the latest `onClose` in a ref so the keydown effect below does
  // not re-bind every render.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key — listener attached once per open/close cycle.
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!isOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop — solid charcoal at 75% instead of bg-charcoal/60 + blur. */}
      <div
        className="fixed inset-0 bg-charcoal/75 animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal box — capped at 90vh with internal scrolling */}
      <div
        className={cn(
          "relative w-full max-w-2xl bg-white shadow-2xl rounded-sm animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]",
          className,
        )}
      >
        <header className="flex items-center justify-between px-8 py-6 border-b border-stone-100 shrink-0">
          <h2 className="font-serif text-xl text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-charcoal transition-colors duration-300 hover:rotate-90"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain ts-scrollbar-bold px-8 py-8">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
