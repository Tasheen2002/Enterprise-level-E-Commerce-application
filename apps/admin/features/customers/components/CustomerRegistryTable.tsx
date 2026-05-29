import React from "react";
import { UserListItem } from "../types";
import {
  User,
  UserCheck,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";

interface CustomerRegistryTableProps {
  users: UserListItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onUpdateStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onViewWishlist?: (user: UserListItem) => void;
}

export const CustomerRegistryTable: React.FC<CustomerRegistryTableProps> = ({
  users,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onUpdateStatus,
  onDelete,
  onViewWishlist,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-50 border-green-100";
      case "blocked":
        return "text-red-600 bg-red-50 border-red-100";
      case "suspended":
        return "text-amber-600 bg-amber-50 border-amber-100";
      default:
        return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <div className="bg-white border border-charcoal/5 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#EBE6D9]/40 border-b border-charcoal/5">
            <th className="px-8 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">
              Member
            </th>
            <th className="px-4 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">
              Role & Type
            </th>
            <th className="px-4 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">
              Status
            </th>
            <th className="px-4 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">
              Joined
            </th>
            <th className="px-8 py-5 text-right text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal/5">
          {isLoading ? (
            <tr>
              <td
                colSpan={5}
                className="px-8 py-20 text-center text-[11px] text-charcoal/40 italic"
              >
                Consulting the registry...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-8 py-20 text-center text-[11px] text-charcoal/40 italic"
              >
                No members found matching your criteria.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id || user.email}
                className="hover:bg-[#F9F8F4]/50 transition-colors group"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F5F1E8] flex items-center justify-center border border-charcoal/5">
                      <User className="w-4 h-4 text-charcoal/30" strokeWidth={1.2} />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-charcoal flex items-center gap-2">
                        {user.firstName
                          ? `${user.firstName} ${user.lastName}`
                          : "Anonymous Artisan"}
                        {user.isGuest && (
                          <span className="text-[8px] bg-charcoal/5 text-charcoal/40 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-charcoal/70 lowercase">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">
                      {user.role.replace("_", " ")}
                    </span>
                    {user.emailVerified && (
                      <span className="text-[8px] text-green-700/85 font-bold flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-[10px] text-charcoal/80">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    {onViewWishlist && (
                      <button
                        onClick={() => onViewWishlist(user)}
                        className="p-2 text-charcoal/40 hover:text-[#C5A059] transition-colors"
                        title="Audit Curations"
                      >
                        <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateStatus(user.id, user.status)}
                      className={`p-2 transition-colors ${
                        user.status === "active"
                          ? "text-charcoal/40 hover:text-red-500"
                          : "text-green-500 hover:text-green-600"
                      }`}
                      title={user.status === "active" ? "Block User" : "Activate User"}
                    >
                      {user.status === "active" ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 text-charcoal/40 hover:text-red-600 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="px-8 py-4 bg-[#EBE6D9]/20 border-t border-charcoal/5 flex justify-between items-center">
          <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">
            Showing page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-charcoal/10 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-charcoal/10 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
