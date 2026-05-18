"use client";

import React, { useState, useEffect } from "react";
import { Key, Smartphone, CheckCircle2, RefreshCcw, X, Copy, Eye, EyeOff } from "lucide-react";
import { api, unwrap } from "@/lib/api-client";
import { toast } from "sonner";

export function SecuritySection() {
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'verify' | 'backup-codes' | 'disable' | 'regenerate'>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const { data, error } = await api.GET("/api/v1/auth/me", {});
        if (!error) {
          const identity = unwrap(data) as any;
          setTwoFactorEnabled(!!identity?.twoFactorEnabled);
        }
      } catch (err) {
        console.error("Failed to fetch 2FA status:", err);
      }
    };
    fetch2FAStatus();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await api.POST("/api/v1/auth/change-password", {
        body: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      console.error("Password change failed:", err);
      toast.error(err?.message || "Failed to change password. Check your current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 2FA handlers
  const handleSetup2FA = async () => {
    setIs2FALoading(true);
    try {
      const { data, error } = await api.POST("/api/v1/auth/2fa/setup", {});
      if (error) throw error;
      const result = unwrap(data) as any;
      setQrCodeUrl(result.qrCodeDataUrl);
      setTwoFASecret(result.secret);
      setTwoFAStep('setup');
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize 2FA setup");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setIs2FALoading(true);
    try {
      const { data, error } = await api.POST("/api/v1/auth/2fa/enable", {
        body: { code: totpCode }
      });
      if (error) throw error;
      const result = unwrap(data) as any;
      setBackupCodes(result.backupCodes || []);
      setTwoFactorEnabled(true);
      setTwoFAStep('backup-codes');
      setTotpCode('');
      toast.success("Two-factor authentication enabled");
    } catch (err: any) {
      toast.error(err?.message || "Invalid code. Please try again.");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error("Password is required");
      return;
    }
    setIs2FALoading(true);
    try {
      const { error } = await api.POST("/api/v1/auth/2fa/disable", {
        body: { password: disablePassword }
      });
      if (error) throw error;
      setTwoFactorEnabled(false);
      setTwoFAStep('idle');
      setDisablePassword('');
      toast.success("Two-factor authentication disabled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to disable 2FA. Check your password.");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!regeneratePassword) {
      toast.error("Password is required");
      return;
    }
    setIs2FALoading(true);
    try {
      const { data, error } = await api.POST("/api/v1/auth/2fa/backup-codes/regenerate", {
        body: { password: regeneratePassword }
      });
      if (error) throw error;
      const result = unwrap(data) as any;
      setBackupCodes(result.backupCodes || []);
      setTwoFAStep('backup-codes');
      setRegeneratePassword('');
      toast.success("New backup codes generated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to regenerate codes. Check your password.");
    } finally {
      setIs2FALoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success("Backup codes copied to clipboard");
  };

  return (
    <div className="space-y-10 pt-12 border-t border-charcoal/5">
      <div>
        <h2 className="text-2xl font-serif text-charcoal mb-2">Authentication</h2>
        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-[0.3em] mb-6">
          Security & Access Controls
        </p>

        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-[#EBE6D9]/50 border border-charcoal/5 rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#F5F1E8] flex items-center justify-center border border-charcoal/5">
                  <Key className="w-4 h-4 text-charcoal/40" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal">Password</h3>
                  <p className="text-[10px] text-charcoal/40 mt-0.5">
                    Regularly updating your password is recommended for optimal security.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-4 pr-10 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-4 pr-10 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-4 pr-10 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-charcoal text-cream px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-all duration-500 rounded-sm shadow-lg shadow-charcoal/10 flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5" />
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* 2FA Card */}
          <div className="bg-[#EBE6D9]/50 border border-charcoal/5 rounded-2xl p-8 shadow-sm">
            {twoFAStep === 'idle' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E8] flex items-center justify-center border border-charcoal/5">
                    <Smartphone className="w-4 h-4 text-charcoal/40" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal">Two-Factor Authentication</h3>
                      {twoFactorEnabled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full border border-emerald-500/10">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-serif italic text-charcoal/70 mt-1">
                      {twoFactorEnabled ? "Authenticator app + 10 single-use backup codes" : "Off"}
                    </p>
                    <p className="text-[10px] text-charcoal/40 mt-0.5">
                      Adds a 6-digit code from your authenticator app on every sign-in.
                    </p>
                  </div>
                </div>
                {twoFactorEnabled ? (
                  <div className="flex gap-2 self-start sm:self-center">
                    <button
                      onClick={() => setTwoFAStep('regenerate')}
                      className="border border-charcoal/20 text-charcoal px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] hover:border-charcoal hover:bg-charcoal/5 transition-all rounded-sm flex items-center gap-1.5"
                    >
                      <RefreshCcw className="w-3 h-3" /> New Codes
                    </button>
                    <button
                      onClick={() => setTwoFAStep('disable')}
                      className="border border-burgundy/20 text-burgundy/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] hover:border-burgundy hover:text-burgundy transition-all rounded-sm"
                    >
                      Disable
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSetup2FA}
                    disabled={is2FALoading}
                    className="self-start sm:self-center border border-charcoal/20 text-charcoal px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal hover:text-cream transition-all rounded-sm"
                  >
                    {is2FALoading ? "Setting up..." : "Enable 2FA"}
                  </button>
                )}
              </div>
            )}

            {twoFAStep === 'setup' && qrCodeUrl && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal">Step 1: Scan QR Code</h3>
                  <button onClick={() => { setTwoFAStep('idle'); setQrCodeUrl(null); }} className="text-charcoal/40 hover:text-charcoal"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-[10px] text-charcoal/50 leading-relaxed">
                  Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code below.
                </p>
                <div className="flex justify-center py-4">
                  <div className="bg-white p-4 rounded-lg shadow-inner border border-charcoal/5">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>
                {twoFASecret && (
                  <div className="text-center">
                    <p className="text-[9px] text-charcoal/40 uppercase tracking-widest mb-1">Or enter this key manually:</p>
                    <code className="text-[11px] font-mono bg-[#F9F8F4] px-4 py-2 rounded text-charcoal/70 select-all">{twoFASecret}</code>
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Step 2: Enter 6-digit code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full max-w-[200px] bg-[#F9F8F4] border border-charcoal/10 px-4 py-3 text-center text-lg font-mono font-bold text-charcoal focus:outline-none focus:border-burgundy transition-colors rounded-sm tracking-[0.5em]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setTwoFAStep('idle'); setQrCodeUrl(null); setTotpCode(''); }}
                    className="flex-1 border border-charcoal/20 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors rounded-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnable2FA}
                    disabled={is2FALoading || totpCode.length !== 6}
                    className="flex-1 bg-charcoal text-cream py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-colors rounded-sm disabled:opacity-50"
                  >
                    {is2FALoading ? "Verifying..." : "Verify & Enable"}
                  </button>
                </div>
              </div>
            )}

            {twoFAStep === 'backup-codes' && backupCodes.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Backup Codes
                  </h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">⚠ Save these codes now</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Each code can only be used once. Store them in a safe place. If you lose your authenticator, these are your only way back in.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#F9F8F4] p-4 rounded-lg border border-charcoal/5">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="text-[12px] font-mono text-charcoal/80 py-1">{code}</code>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyBackupCodes}
                    className="flex-1 border border-charcoal/20 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors rounded-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-3 h-3" /> Copy All
                  </button>
                  <button
                    onClick={() => { setTwoFAStep('idle'); setBackupCodes([]); }}
                    className="flex-1 bg-charcoal text-cream py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-colors rounded-sm"
                  >
                    I've Saved Them
                  </button>
                </div>
              </div>
            )}

            {twoFAStep === 'disable' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal">Disable Two-Factor Authentication</h3>
                  <button onClick={() => { setTwoFAStep('idle'); setDisablePassword(''); }} className="text-charcoal/40 hover:text-charcoal"><X className="w-4 h-4" /></button>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Disabling 2FA will remove the extra layer of security from your admin account. Enter your password to confirm.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Password Confirmation</label>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#F9F8F4] border border-charcoal/10 px-4 py-3 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors rounded-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setTwoFAStep('idle'); setDisablePassword(''); }}
                    className="flex-1 border border-charcoal/20 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors rounded-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={is2FALoading || !disablePassword}
                    className="flex-1 bg-burgundy text-cream py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-800 transition-colors rounded-sm disabled:opacity-50"
                  >
                    {is2FALoading ? "Disabling..." : "Disable 2FA"}
                  </button>
                </div>
              </div>
            )}

            {twoFAStep === 'regenerate' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-charcoal">Regenerate Backup Codes</h3>
                  <button onClick={() => { setTwoFAStep('idle'); setRegeneratePassword(''); }} className="text-charcoal/40 hover:text-charcoal"><X className="w-4 h-4" /></button>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    This will invalidate all your existing backup codes and generate a new set. Enter your password to confirm.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Password Confirmation</label>
                  <input
                    type="password"
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#F9F8F4] border border-charcoal/10 px-4 py-3 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors rounded-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setTwoFAStep('idle'); setRegeneratePassword(''); }}
                    className="flex-1 border border-charcoal/20 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors rounded-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    disabled={is2FALoading || !regeneratePassword}
                    className="flex-1 bg-charcoal text-cream py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-colors rounded-sm disabled:opacity-50"
                  >
                    {is2FALoading ? "Generating..." : "Generate New Codes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
