import React from "react";
import { Edit, Trash2, CornerDownRight } from "lucide-react";
import { Category } from "../types";

interface CategoryTreeViewProps {
  categories: Category[];
  searchQuery: string;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  categories,
  searchQuery,
  onEdit,
  onDelete,
}) => {
  // Helper to map parent name
  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return "-";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "-";
  };

  // Filter categories locally by search term
  const filteredCategories = categories.filter((c) => {
    const term = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
    );
  });

  if (filteredCategories.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm font-serif italic text-charcoal/50 mb-1">
          No categories found
        </p>
        <p className="text-[10px] uppercase tracking-[0.15em] text-charcoal/30">
          Try adjusting your query or create a new collection category
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-charcoal/10 bg-[#FBF9F5] text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/60">
            <th className="py-4 px-6 font-semibold">Position</th>
            <th className="py-4 px-6 font-semibold">Category Name</th>
            <th className="py-4 px-6 font-semibold">Slug Mapping</th>
            <th className="py-4 px-6 font-semibold">Parent Line</th>
            <th className="py-4 px-6 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal/5 text-xs text-charcoal/80">
          {filteredCategories.map((cat) => {
            const isChild = !!cat.parentId;
            return (
              <tr
                key={cat.id}
                className="hover:bg-[#F9F8F4]/50 transition-colors duration-200"
              >
                <td className="py-4.5 px-6 font-mono text-[10px] text-charcoal/40">
                  {cat.position !== undefined && cat.position !== null
                    ? cat.position
                    : 0}
                </td>
                <td className="py-4.5 px-6 font-serif">
                  <div className="flex items-center gap-2">
                    {isChild && (
                      <CornerDownRight className="w-3.5 h-3.5 text-charcoal/30 shrink-0" />
                    )}
                    <span
                      className={`${
                        isChild
                          ? "text-charcoal/70"
                          : "font-semibold text-charcoal text-sm"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </div>
                </td>
                <td className="py-4.5 px-6">
                  <span className="font-mono text-[10px] bg-charcoal/5 px-2 py-0.5 rounded-full text-charcoal/60">
                    {cat.slug}
                  </span>
                </td>
                <td className="py-4.5 px-6 text-charcoal/60 font-serif italic">
                  {getParentName(cat.parentId)}
                </td>
                <td className="py-4.5 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(cat)}
                      className="p-2 border border-charcoal/10 hover:border-charcoal hover:bg-white text-charcoal/50 hover:text-charcoal transition-all rounded-sm active:scale-90"
                      title="Edit Category"
                    >
                      <Edit className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onDelete(cat.id)}
                      className="p-2 border border-charcoal/10 hover:border-red-600 hover:bg-red-50 text-charcoal/50 hover:text-red-600 transition-all rounded-sm active:scale-90"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
