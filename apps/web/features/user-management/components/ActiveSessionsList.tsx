import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Monitor, Smartphone, Globe, LogOut, Clock, ShieldAlert } from "lucide-react";
import { useActiveSessions, useRevokeSession } from "../hooks/useActiveSessions";
import { Button } from "@tasheen/ui";

export function ActiveSessionsList() {
  const { data: sessions, isLoading, isError } = useActiveSessions();
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !sessions) {
    return (
      <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-6 text-center text-red-500">
        <ShieldAlert className="mx-auto mb-2 h-8 w-8 opacity-80" />
        <p className="text-sm font-medium">Failed to load active sessions.</p>
        <p className="text-xs opacity-80">Please refresh the page to try again.</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center">
        <p className="text-sm text-gray-400">No active sessions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session, index) => {
        const isCurrentSession = index === 0; // The query orders by createdAt DESC, so the first one is the newest (current). In a real app we'd match the exact token ID.
        
        return (
          <div
            key={session.id}
            className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.07]"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-white/10 p-3">
                {session.deviceType === "mobile" || session.os?.toLowerCase().includes("ios") || session.os?.toLowerCase().includes("android") ? (
                  <Smartphone className="h-6 w-6 text-gray-300" />
                ) : (
                  <Monitor className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">
                    {session.os || "Unknown OS"} • {session.browser || "Unknown Browser"}
                  </h4>
                  {isCurrentSession && (
                    <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30">
                      Current Device
                    </span>
                  )}
                </div>
                
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300 font-medium">
                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                    <Globe className="h-3 w-3 text-blue-400" />
                    {session.ipAddress || "Hidden IP"}
                  </span>
                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                    <Clock className="h-3 w-3 text-purple-400" />
                    <span suppressHydrationWarning>
                      Started {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isRevoking || isCurrentSession}
              onClick={() => revokeSession(session.id)}
              className="w-full sm:w-auto h-9 text-xs font-bold uppercase tracking-wider border-white/10 bg-white/5 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all disabled:opacity-30"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              {isCurrentSession ? "Active" : "Revoke"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
