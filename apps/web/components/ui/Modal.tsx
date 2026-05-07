"use client";

import * as React from "react";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div className={cn(
        "relative w-full max-w-2xl bg-white shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 fade-in duration-300",
        className
      )}>
        <header className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
          <h2 className="font-serif text-xl text-charcoal">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-charcoal transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        
        <div className="px-8 py-8 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
