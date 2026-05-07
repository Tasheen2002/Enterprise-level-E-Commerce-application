"use client";

import { useState } from "react";
import { 
  Plus, 
  CreditCard, 
  Trash2, 
  CheckCircle2,
  Loader2,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { Button, cn } from "@tasheen/ui";
import { toast } from "sonner";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { PaymentMethod } from "../types";
import { Modal } from "@/components/ui/Modal";
// Import PaymentMethodForm when we create it
// import { PaymentMethodForm } from "./PaymentMethodForm";

export function PaymentMethodsList() {
  const { paymentMethods, isLoading, deletePaymentMethod, setDefaultPaymentMethod } = usePaymentMethods();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    toast("Remove payment method?", {
      description: "This card will be permanently removed from your wallet.",
      action: {
        label: "Remove",
        onClick: async () => {
          try {
            await deletePaymentMethod.mutateAsync(id);
            toast.success("Payment method removed");
          } catch (err: any) {
            toast.error(err.message || "Failed to remove card");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod.mutateAsync(id);
      toast.success("Primary payment method updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update default card");
    }
  };

  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h1 className="font-serif text-5xl text-charcoal leading-tight">
          Payment Methods
        </h1>
        <p className="text-stone-400 max-w-2xl text-sm leading-relaxed">
          Manage your saved cards and payment instruments for secure, effortless transactions across the Slipperze boutique.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-stone-100 divide-x divide-y divide-stone-100 bg-white shadow-sm">
          {/* Existing Methods */}
          {paymentMethods.map((method) => (
            <PaymentMethodCard 
              key={method.id} 
              method={method} 
              onDelete={() => handleDelete(method.id)}
              onSetDefault={() => handleSetDefault(method.id)}
              isDeleting={deletePaymentMethod.isPending && deletePaymentMethod.variables === method.id}
            />
          ))}

          {/* Add New Card */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="group relative flex flex-col items-center justify-center gap-6 p-12 min-h-[280px] bg-stone-50/20 hover:bg-white transition-all duration-700"
          >
            <div className="p-5 bg-white rounded-full text-stone-300 group-hover:text-gold shadow-sm transition-all duration-700">
              <Plus className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-serif text-2xl text-charcoal tracking-wide">Register card</h4>
              <p className="text-[9px] text-stone-400 max-w-[180px] mx-auto leading-relaxed uppercase tracking-[0.2em]">
                Secure a new artisanal payment method.
              </p>
            </div>
          </button>
        </div>
      )}

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Add Payment Method"
      >
        <div className="p-12 text-center space-y-6">
           <div className="flex justify-center">
             <div className="p-6 bg-stone-50 rounded-full">
               <ShieldCheck className="h-12 w-12 text-gold" />
             </div>
           </div>
           <div className="space-y-2">
             <h3 className="font-serif text-2xl text-charcoal">Secure Payment Entry</h3>
             <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed">
               For your security, Slipperze uses Stripe to process and save payment information.
             </p>
           </div>
           <Button 
            variant="primary" 
            className="w-full"
            onClick={() => {
              toast.info("Stripe integration coming soon in this demo environment.");
              setIsAddModalOpen(false);
            }}
           >
             Continue to Stripe
           </Button>
        </div>
      </Modal>
    </div>
  );
}

function PaymentMethodCard({ 
  method, 
  onDelete, 
  onSetDefault,
  isDeleting 
}: { 
  method: PaymentMethod; 
  onDelete: () => void;
  onSetDefault: () => void;
  isDeleting: boolean;
}) {
  const isCard = method.type === "CARD";

  return (
    <div className="group relative bg-white p-10 flex flex-col justify-between min-h-[280px] transition-all duration-500">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
             {method.isDefault && (
               <div className="flex items-center gap-2 text-[8px] font-bold text-gold uppercase tracking-[0.2em]">
                 <CheckCircle2 className="h-3 w-3" /> Primary Method
               </div>
             )}
             <h3 className="font-serif text-3xl text-charcoal pt-2 flex items-center gap-3 italic">
               <CreditCard className="h-6 w-6 text-stone-200" strokeWidth={1.5} />
               {isCard ? (
                 <span className="flex items-center gap-3">
                    <span className="text-stone-300 font-sans text-xl tracking-[0.3em]">••••</span> 
                    {method.last4}
                 </span>
               ) : (
                 method.displayName
               )}
             </h3>
             <p className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.2em]">
               {method.brand || method.type} Portfolio
             </p>
          </div>
          
          <button 
            onClick={onDelete}
            disabled={isDeleting || method.isDefault}
            className={cn(
              "p-2 transition-colors duration-500",
              method.isDefault ? "text-stone-100 cursor-not-allowed" : "text-stone-300 hover:text-burgundy"
            )}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 stroke-[1.5]" />}
          </button>
        </div>

        {isCard && method.expiryDisplay && (
          <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold uppercase tracking-[0.15em]">
             <Calendar className="h-4 w-4 text-stone-300 stroke-[1.5]" />
             Valid Thru {method.expiryDisplay}
             {method.isExpired && (
               <span className="ml-2 text-[8px] text-burgundy font-bold uppercase tracking-widest bg-burgundy/5 px-2 py-0.5 border border-burgundy/10">
                 Expired
               </span>
             )}
          </div>
        )}
      </div>

      <div className="pt-10 mt-auto border-t border-stone-50">
        {!method.isDefault ? (
          <button 
            onClick={onSetDefault}
            className="text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400 hover:text-gold transition-colors flex items-center gap-2 group/btn"
          >
            Elevate to primary
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-gold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Security
          </div>
        )}
      </div>
    </div>
  );
}
