"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@tasheen/ui";
import { SearchDialog } from "../../features/product-catalog/components/SearchDialog";

interface HeaderSearchButtonProps {
  isTransparent: boolean;
}

export function HeaderSearchButton({ isTransparent }: HeaderSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Search Dialog"
        className={cn(
          "relative transition-all duration-300 hover:scale-110 p-1 focus:outline-none",
          isTransparent
            ? "text-cream hover:text-cream"
            : "text-charcoal hover:text-gold"
        )}
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.2} />
      </button>

      {isOpen && <SearchDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
