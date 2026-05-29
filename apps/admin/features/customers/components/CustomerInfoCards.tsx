import React from "react";
import { Shield, ShieldAlert, Mail } from "lucide-react";

export const CustomerInfoCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-[#EBE6D9] border border-charcoal/5 rounded-xl shadow-sm group hover:bg-[#EBE6D9]/80 transition-all duration-500">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" />{" "}
          Security Protocol
        </h3>
        <p className="text-[10px] text-charcoal/75 leading-relaxed">
          Blocking a user will immediately terminate all active sessions and prevent
          future authentication until restored.
        </p>
      </div>
      <div className="p-6 bg-[#EBE6D9] border border-charcoal/5 rounded-xl shadow-sm group hover:bg-[#EBE6D9]/80 transition-all duration-500">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-3 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" />{" "}
          Communication
        </h3>
        <p className="text-[10px] text-charcoal/75 leading-relaxed">
          Email verification status is managed by the system. Manual overrides should
          only be used after identity verification.
        </p>
      </div>
      <div className="p-6 bg-[#EBE6D9] border border-charcoal/5 rounded-xl shadow-sm group hover:bg-[#EBE6D9]/80 transition-all duration-500">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" />{" "}
          Data Integrity
        </h3>
        <p className="text-[10px] text-charcoal/75 leading-relaxed">
          User deletion is permanent. All orders, addresses, and profiles linked to this
          ID will be purged or anonymized.
        </p>
      </div>
    </div>
  );
};
