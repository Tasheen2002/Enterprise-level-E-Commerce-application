"use client";

import { createContext, useCallback, useContext, useState, type PropsWithChildren, type ReactNode } from "react";

/**
 * Tiny global-modal stack. Feature code calls `openModal(<Drawer/>)` to
 * push a modal onto the stack and `closeModal()` to pop. Lives at the app
 * root so any descendant (header, PDP, cart drawer) can open one without
 * prop-drilling.
 */
type ModalEntry = { id: string; node: ReactNode };

interface ModalContextValue {
  openModal: (node: ReactNode) => string;
  closeModal: (id?: string) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: PropsWithChildren) {
  const [stack, setStack] = useState<ModalEntry[]>([]);

  const openModal = useCallback((node: ReactNode) => {
    const id = crypto.randomUUID();
    setStack((s) => [...s, { id, node }]);
    return id;
  }, []);

  const closeModal = useCallback((id?: string) => {
    setStack((s) => (id ? s.filter((e) => e.id !== id) : s.slice(0, -1)));
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {stack.map((entry) => (
        <div key={entry.id} role="dialog" aria-modal="true">
          {entry.node}
        </div>
      ))}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider />");
  return ctx;
}
