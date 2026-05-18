"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { imageKitUrl } from "@/lib/imagekit";
import { useCategories } from "../hooks/useCategories";

export function CategoryGallery({ category }: { category: string }) {
  const { data: items, isLoading } = useCategories(category);

  if (isLoading) {
    return (
      <div className="py-32 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-20 text-center text-[10px] uppercase tracking-widest text-stone-400">
        New artisanal collections arriving soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-12">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: index * 0.1, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          className="group relative aspect-[4/5] overflow-hidden bg-stone-100"
        >
          <Link href={item.href} className="block h-full w-full">
            <Image
              src={item.image.startsWith('/') ? item.image : `/images/catalog/leather-goods/${item.image}`}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors duration-700" />
            
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-white text-xs md:text-sm font-bold tracking-[0.3em] uppercase drop-shadow-sm">
                {item.title}
              </h3>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
