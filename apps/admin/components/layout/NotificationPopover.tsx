"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import {
  useAdminNotifications,
  useAdminMarkNotificationRead,
  useAdminMarkAllNotificationsRead,
} from "../../features/orders/hooks/useAdminOrders";
import { useRouter } from "next/navigation";

// Formatter to render when an alert occurred relative to now
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "min" : "mins"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [], isLoading } = useAdminNotifications();
  const { mutate: markRead } = useAdminMarkNotificationRead();
  const { mutate: markAllRead } = useAdminMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleNotificationClick = (n: any) => {
    setIsOpen(false);
    if (!n.isRead) {
      markRead(n.id);
    }
    if (n.targetUrl) {
      router.push(n.targetUrl);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-charcoal/30 hover:text-charcoal transition-colors duration-300 relative group flex items-center justify-center rounded-full hover:bg-charcoal/5"
        title="Notifications Panel"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.2} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-burgundy rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-[#FCFBF8] border border-charcoal/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
            
            {/* Header */}
            <div className="bg-[#FBF9F5] border-b border-charcoal/5 px-5 py-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/80">Alert Log Registry</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[8px] font-bold uppercase tracking-widest text-[#C5A059] hover:text-burgundy flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> Mark read
                </button>
              )}
            </div>

            {/* Notification List container */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-charcoal/[0.04] ts-scrollbar">
              {isLoading ? (
                <div className="py-12 text-center text-charcoal/40 flex flex-col items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-charcoal/15 border-t-burgundy animate-spin rounded-full" />
                  <p className="text-[9px] uppercase tracking-widest font-bold text-charcoal/40 mt-1">Reading events feed...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center text-charcoal/40 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-charcoal/20" strokeWidth={1.2} />
                  <p className="text-xs italic font-serif text-charcoal/60">Registry clear</p>
                  <p className="text-[8px] uppercase tracking-wider font-bold text-charcoal/40">No active system events pending audit.</p>
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`block px-5 py-4 hover:bg-[#F9F8F4] transition-colors duration-200 cursor-pointer ${
                      !n.isRead ? "bg-burgundy/[0.015]" : ""
                    }`}
                  >
                    <div className="flex gap-2.5 items-start">
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-burgundy mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-bold text-charcoal truncate">{n.title}</p>
                          <span className="text-[8px] text-stone-400 font-medium whitespace-nowrap">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-charcoal/60 leading-relaxed mt-0.5 break-words">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#FBF9F5] border-t border-charcoal/5 px-5 py-3.5 text-center flex items-center justify-center gap-1">
              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400 animate-pulse">
                Audited in real-time
              </span>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
