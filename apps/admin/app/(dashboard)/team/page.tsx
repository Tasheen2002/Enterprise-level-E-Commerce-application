"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Mail, Shield, Clock, X, CheckCircle } from "lucide-react";
import { api, unwrap } from "../../../lib/api-client";
import { toast } from "sonner";
import { useModal } from "@/providers/ModalProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
}

export default function TeamPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { openModal, closeModal } = useModal();

  const fetchInvitations = async () => {
    try {
      const { data, error } = await api.GET("/api/v1/admin/invitations", {});
      if (error) throw new Error((error as ApiErrorBody).message || "Failed to fetch invitations");
      if (!data) throw new Error("No data received from server");
      const invitationsData = unwrap(data);
      setInvitations(invitationsData as Invitation[]);
    } catch (err: unknown) {
      console.error("Failed to fetch invitations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsInviting(true);

    try {
      const { data, error } = await api.POST("/api/v1/admin/invitations", {
        body: {
          email,
          role: role as "ADMIN" | "INVENTORY_STAFF" | "CUSTOMER_SERVICE" | "ANALYST",
        },
      });
      if (error) throw new Error((error as ApiErrorBody).message);
      if (!data) throw new Error("No response from server");
      unwrap(data);
      
      setSuccess(`Invitation sent to ${email}`);
      toast.success(`Invitation successfully sent to ${email}`);
      setEmail("");
      fetchInvitations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    openModal(
      <ConfirmModal
        title="Revoke Staff Invitation"
        message="Are you sure you want to revoke this invitation? The recipient will no longer be able to use the link to set up their account."
        confirmLabel="Revoke Invitation"
        variant="warning"
        onConfirm={async () => {
          try {
            const { data, error } = await api.DELETE("/api/v1/admin/invitations/{invitationId}", {
              params: {
                path: { invitationId: id }
              }
            });
            if (error) throw new Error((error as ApiErrorBody).message);
            // Revoke returns actionSuccessResponse (no data field), so we skip unwrap
            setInvitations(invitations.filter(inv => inv.id !== id));
            setSuccess("Invitation revoked successfully");
            toast.success("Staff invitation has been revoked");
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to revoke invitation";
            setError(msg);
            toast.error(msg);
          }
        }}
        onClose={() => closeModal()}
      />
    );
  };

  return (
    <div className="p-10 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-serif italic text-charcoal mb-2">Team Atelier</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-charcoal/40 font-bold">
          Manage Staff Invitations & Roles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#EBE6D9] border border-charcoal/5 p-8 rounded-sm sticky top-10">
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-charcoal/80 mb-6 flex items-center gap-2">
              <UserPlus className="w-3 h-3" /> Commission New Access
            </h2>

            <form onSubmit={handleInvite} className="space-y-6">
              {error && (
                <div className="text-[10px] bg-red-50 text-red-600 p-3 border border-red-100 rounded-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-[10px] bg-green-50 text-green-600 p-3 border border-green-100 rounded-sm">
                  {success}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="artisan@tasheen.com"
                    className="w-full bg-white/40 border border-charcoal/10 pl-10 pr-4 py-3 text-[11px] focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">
                  Access Level
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white/40 border border-charcoal/10 pl-10 pr-4 py-3 text-[11px] focus:outline-none focus:border-[#C5A059] appearance-none transition-colors rounded-sm"
                  >
                    <option value="ADMIN">Atelier Admin</option>
                    <option value="INVENTORY_STAFF">Inventory Manager</option>
                    <option value="CUSTOMER_SERVICE">Concierge Staff</option>
                    <option value="ANALYST">Portfolio Analyst</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="w-full bg-charcoal text-[#F5F1E8] py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#1a1a1a] transition-all disabled:opacity-50"
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>

        {/* Invitations List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-charcoal/5 rounded-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-charcoal/5 flex justify-between items-center">
              <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-charcoal/80">
                Pending Invitations
              </h2>
              <span className="text-[9px] bg-[#F5F1E8] px-2 py-1 rounded-full text-charcoal/40 font-bold">
                {invitations.length} Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-charcoal/5">
                    <th className="px-8 py-4 text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">Email</th>
                    <th className="px-4 py-4 text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">Role</th>
                    <th className="px-4 py-4 text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">Expires</th>
                    <th className="px-8 py-4 text-right text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-[11px] text-charcoal/40 italic">
                        Retrieving staff registry...
                      </td>
                    </tr>
                  ) : invitations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-[11px] text-charcoal/40 italic">
                        No pending invitations found.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#F9F8F4]/50 transition-colors">
                        <td className="px-8 py-4">
                          <div className="text-[11px] font-medium text-charcoal">{inv.email}</div>
                          <div className="text-[9px] text-charcoal/40 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" /> Sent {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/5 px-2 py-1 rounded-sm border border-[#C5A059]/10">
                            {inv.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[10px] text-charcoal/60">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => handleRevoke(inv.id)}
                            className="text-charcoal/30 hover:text-red-500 transition-colors p-2"
                            title="Revoke Invitation"
                          >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-6 bg-[#EBE6D9]/30 border border-charcoal/5 rounded-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-2 flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-[#C5A059]" /> Secure Onboarding
            </h3>
            <p className="text-[10px] text-charcoal/50 leading-relaxed italic">
              All invitations are time-limited (72h) and cryptographically secured. 
              Once accepted, the recipient will be granted immediate access to their assigned domain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
