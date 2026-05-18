import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Monitor, Smartphone, Globe, LogOut, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useActiveSessions, useRevokeSession } from "../hooks/useActiveSessions";
import { Button, cn } from "@tasheen/ui";

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
    <div className="space-y-6">
      {sessions.map((session, index) => {
        const isCurrentSession = index === 0;
        
        return (
          <div
            key={session.id}
            className="flex flex-col gap-6 rounded-none border border-stone-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between transition-all duration-500 shadow-lg hover:shadow-xl hover:border-gold group"
          >
            <div className="flex items-start gap-6">
              <div className="rounded-full bg-stone-50 p-4 text-stone-400 group-hover:bg-charcoal group-hover:text-gold transition-all duration-500 border border-stone-100">
                {session.deviceType === "mobile" || session.os?.toLowerCase().includes("ios") || session.os?.toLowerCase().includes("android") ? (
                  <Smartphone className="h-6 w-6 stroke-[1.5]" />
                ) : (
                  <Monitor className="h-6 w-6 stroke-[1.5]" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="font-serif text-2xl text-charcoal italic leading-none">
                    {session.os || "Unknown System"} • {session.browser || "Unknown Browser"}
                  </h4>
                  {isCurrentSession && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold text-white text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Current Device
                    </span>
                  )}
                </div>
                
                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.1em] font-bold text-stone-600">
                    <Globe className="h-4 w-4 text-gold/60" />
                    <span>{session.ipAddress || "Hidden Network"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.1em] font-bold text-stone-600">
                    <Clock className="h-4 w-4 text-gold/60" />
                    <span suppressHydrationWarning>
                      {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isRevoking || isCurrentSession}
              onClick={() => revokeSession(session.id)}
              className={cn(
                "w-full sm:w-auto h-12 px-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                isCurrentSession 
                  ? "bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed"
                  : "bg-charcoal text-white hover:bg-gold hover:text-white border-transparent"
              )}
            >
              <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
              {isCurrentSession ? "Authenticated" : "Revoke Access"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
