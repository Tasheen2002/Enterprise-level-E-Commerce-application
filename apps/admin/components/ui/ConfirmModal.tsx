"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  variant = "danger",
}: ConfirmModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          button: "bg-red-600 hover:bg-red-700 text-white",
          iconBg: "bg-red-50",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          button: "bg-amber-600 hover:bg-amber-700 text-white",
          iconBg: "bg-amber-50",
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-[#C5A059]" />,
          button: "bg-charcoal hover:bg-charcoal/90 text-white",
          iconBg: "bg-[#F5F1E8]",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {styles.icon}
            </div>
            
            <div className="flex-1">
              <div className="mb-1">
                <h3 className="text-sm font-serif italic text-charcoal text-lg">
                  {title}
                </h3>
              </div>
              
              <p className="text-[11px] text-charcoal/60 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#F9F8F4] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-charcoal/40 hover:text-charcoal transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm shadow-lg shadow-black/5 transition-all active:scale-95 ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
