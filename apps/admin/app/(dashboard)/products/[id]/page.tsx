"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ProductRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/products/${id}/variants`);
    }
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-8 h-8 border-2 border-charcoal/10 border-t-burgundy rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest animate-pulse">
        Resolving product workspace...
      </p>
    </div>
  );
}
