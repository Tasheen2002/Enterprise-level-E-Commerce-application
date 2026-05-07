"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Loader2,
  ShieldAlert
} from "lucide-react";
import { 
  Button, 
  Input, 
  FormField,
  PasswordInput 
} from "@tasheen/ui";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion"),
});

type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;

export function DeleteAccountForm() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteAccount = useDeleteAccount();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const onSubmit = (values: DeleteAccountValues) => {
    deleteAccount.mutate(values);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <div className="flex items-center gap-4 text-burgundy">
          <ShieldAlert className="h-8 w-8" />
          <h1 className="font-serif text-3xl tracking-tight text-charcoal">Account Permanence</h1>
        </div>
        <p className="text-stone-500 leading-relaxed max-w-xl">
          We are sorry to see you go. Deleting your Slipperze account is a final and irreversible action. 
          All artisanal history, bespoke preferences, and personal data will be purged from our archives.
        </p>
      </header>

      <div className="bg-stone-50 border border-stone-100 p-8 lg:p-12 space-y-8 rounded-sm shadow-sm relative overflow-hidden">
        {/* Subtle warning background pattern would go here */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Trash2 className="h-32 w-32" />
        </div>

        <div className="space-y-6 relative z-10">
          <h2 className="font-serif text-xl text-charcoal">What happens next?</h2>
          <ul className="space-y-4 text-sm text-stone-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1 w-1 rounded-full bg-burgundy shrink-0" />
              <span>Instant revocation of all artisanal member benefits and early-access privileges.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1 w-1 rounded-full bg-burgundy shrink-0" />
              <span>Permanent removal of your order history and digital wardrobe.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1 w-1 rounded-full bg-burgundy shrink-0" />
              <span>Loss of saved bespoke measurements and leather detailing preferences.</span>
            </li>
          </ul>
        </div>

        {!isConfirmOpen ? (
          <Button 
            variant="ghost" 
            className="text-burgundy hover:bg-burgundy/5 hover:text-burgundy font-bold uppercase tracking-[0.2em] text-[10px]"
            onClick={() => setIsConfirmOpen(true)}
          >
            Initiate Deletion Process
          </Button>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-burgundy/[0.02] border border-burgundy/10 rounded-sm space-y-6">
              <div className="flex items-center gap-3 text-burgundy">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Final Confirmation Required</span>
              </div>
              
              <FormField id="delete-password" label="Security Verification" error={errors.password?.message}>
                <PasswordInput 
                  {...register("password")}
                  placeholder="Enter your password to authorize"
                  className="bg-white border-stone-200 focus:border-burgundy transition-colors"
                />
              </FormField>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="submit" 
                  disabled={deleteAccount.isPending}
                  className="bg-burgundy hover:bg-burgundy-dark text-cream border-none flex-1 h-14 uppercase tracking-[0.2em] text-[10px] font-bold shadow-lg shadow-burgundy/10"
                >
                  {deleteAccount.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete Permanently"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => {
                    setIsConfirmOpen(false);
                    reset();
                  }}
                  className="flex-1 h-14 uppercase tracking-[0.2em] text-[10px] font-bold border-stone-200 hover:bg-stone-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      <footer className="pt-8 border-t border-stone-100 flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-stone-400">
        <span>Slipperze Account Protection</span>
        <span>Secure Purge Protocol</span>
      </footer>
    </div>
  );
}
