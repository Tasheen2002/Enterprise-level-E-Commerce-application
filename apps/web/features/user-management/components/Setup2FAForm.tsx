"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, FormField } from "@tasheen/ui";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useSetup2FA } from "../hooks/useSetup2FA";
import { useEnable2FA } from "../hooks/useEnable2FA";

const codeFormSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
});

type CodeFormValues = z.infer<typeof codeFormSchema>;

type Step = "loading" | "scan" | "verify" | "backup" | "error";

/**
 * Two-factor enrolment, modelled as a guided three-step flow:
 *
 * 1. **scan**  — show the QR code + manual-entry secret. The user
 *    scans with Google Authenticator / Authy / 1Password.
 * 2. **verify** — collect the first 6-digit code. On success the
 *    backend flips `twoFactorEnabled = true` and returns a fresh
 *    batch of backup codes.
 * 3. **backup** — display + offer copy/download. After this view
 *    the codes can NEVER be retrieved again — only regenerated,
 *    which invalidates the old set.
 *
 * `onSuccess` only fires once the user explicitly confirms they've
 * saved their codes (final step's "Done" button) — closing the modal
 * earlier still leaves 2FA enabled but the codes are unrecoverable.
 */
export function Setup2FAForm({ onSuccess }: { onSuccess: () => void }) {
  const setupMutation = useSetup2FA();
  const enableMutation = useEnable2FA();

  const [step, setStep] = useState<Step>("loading");
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: "" },
  });

  // Kick off setup when the modal mounts. We deliberately don't gate
  // this on a button click — the user has already opted in by clicking
  // "Enable 2FA" in SecuritySettings.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await setupMutation.mutateAsync();
        if (cancelled) return;
        setSecret(result.secret);
        setQrCodeDataUrl(result.qrCodeDataUrl);
        setStep("scan");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to start 2FA setup.";
        setServerError(message);
        setStep("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = codeForm.handleSubmit(async ({ code }) => {
    setServerError(null);
    try {
      const result = await enableMutation.mutateAsync(code);
      setBackupCodes(result.backupCodes);
      setStep("backup");
      toast.success("Two-factor authentication enabled.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed.";
      setServerError(message);
      toast.error(message);
    }
  });

  if (step === "loading") {
    return (
      <div className="space-y-6 py-12 text-center">
        <Loader2 className="h-10 w-10 text-gold mx-auto animate-spin" />
        <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em]">
          Generating authenticator credentials...
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="space-y-6 py-8">
        <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs">
          <AlertCircle className="h-4 w-4" />
          {serverError}
        </div>
        <Button variant="ghost" fullWidth onClick={onSuccess}>
          Close
        </Button>
      </div>
    );
  }

  if (step === "backup" && backupCodes) {
    return (
      <BackupCodesView
        codes={backupCodes}
        onDone={() => {
          setBackupCodes(null);
          onSuccess();
        }}
      />
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-6 pt-4 pb-2">
        <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
          <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
            Confirmation
          </p>
          <p className="font-serif text-3xl text-charcoal italic leading-tight">
            Verify Your Code
          </p>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Enter the 6-digit code your authenticator app is showing now.
          </p>
        </div>

        <FormField
          id="code"
          label="6-digit verification code"
          error={codeForm.formState.errors.code?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            variant="boxed"
            placeholder="123456"
            hasError={Boolean(codeForm.formState.errors.code)}
            {...codeForm.register("code")}
          />
        </FormField>

        {serverError && (
          <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs">
            <AlertCircle className="h-4 w-4" />
            {serverError}
          </div>
        )}

        <div className="pt-8 space-y-3">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md"
            disabled={
              codeForm.formState.isSubmitting || enableMutation.isPending
            }
            isLoading={
              codeForm.formState.isSubmitting || enableMutation.isPending
            }
          >
            Activate 2FA
          </Button>
          <button
            type="button"
            onClick={() => {
              setServerError(null);
              codeForm.reset();
              setStep("scan");
            }}
            className="w-full text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-charcoal transition-colors py-2"
          >
            Back to QR code
          </button>
        </div>
      </form>
    );
  }

  // step === "scan"
  return (
    <div className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-8 pb-6 border-b border-stone-50">
        <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
          Step 1 of 3
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Scan with your app
        </p>
        <p className="text-[11px] text-stone-400 leading-relaxed">
          Open Google Authenticator, Authy, 1Password, or any TOTP app
          and scan the code below.
        </p>
      </div>

      {qrCodeDataUrl && (
        <div className="flex justify-center">
          <img
            src={qrCodeDataUrl}
            alt="2FA QR code"
            className="border border-stone-100 p-3 bg-white"
            width={256}
            height={256}
          />
        </div>
      )}

      <div className="space-y-2 pt-4">
        <p className="text-[9px] text-stone-400 uppercase tracking-[0.3em] font-bold text-center">
          Or enter this secret manually
        </p>
        {secret && (
          <div className="flex items-center justify-between gap-2 p-3 border border-stone-100 bg-stone-50/50">
            <code className="font-mono text-sm text-charcoal break-all">
              {secret}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(secret);
                toast.success("Secret copied.");
              }}
              className="shrink-0 text-stone-400 hover:text-charcoal"
              aria-label="Copy secret"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          fullWidth
          onClick={() => setStep("verify")}
          className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md"
        >
          I've Added It
        </Button>
      </div>
    </div>
  );
}

/**
 * Final step: backup codes. Big visual emphasis on "save these now"
 * because they cannot be retrieved later. The "Done" button is
 * deliberately not auto-focused — we want the user to engage with
 * Copy/Download first.
 */
function BackupCodesView({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(codes.join("\n"));
    toast.success("Backup codes copied.");
  };

  const handleDownload = () => {
    const blob = new Blob([codes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slipperze-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-8 pb-6 border-b border-stone-50">
        <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
        <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
          Save These Now
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Your Backup Codes
        </p>
        <p className="text-[11px] text-stone-400 leading-relaxed max-w-md mx-auto">
          Each code can be used once to sign in if you lose access to your
          authenticator app. Store them somewhere safe — they will not be
          shown again.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 bg-stone-50/50 border border-stone-100">
        {codes.map((c) => (
          <code
            key={c}
            className="font-mono text-sm text-charcoal text-center py-1"
          >
            {c}
          </code>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="ghost"
          onClick={handleCopy}
          className="h-12 uppercase tracking-[0.2em] text-[10px] font-bold border border-stone-200"
        >
          <Copy className="h-4 w-4 mr-2" /> Copy
        </Button>
        <Button
          variant="ghost"
          onClick={handleDownload}
          className="h-12 uppercase tracking-[0.2em] text-[10px] font-bold border border-stone-200"
        >
          <Download className="h-4 w-4 mr-2" /> Download
        </Button>
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          fullWidth
          onClick={onDone}
          className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" /> I've Saved My Codes
        </Button>
      </div>
    </div>
  );
}

export { BackupCodesView };
