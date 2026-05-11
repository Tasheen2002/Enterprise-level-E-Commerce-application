"use client";

import { useState } from "react";
import { 
  Plus, 
  CreditCard, 
  Loader2,
  MoreVertical,
  Star
} from "lucide-react";
import { Button, cn } from "@tasheen/ui";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { PaymentMethod } from "../types";
import { Modal } from "@/components/ui/Modal";

const StripeAddCardForm = dynamic(() => import("./StripeAddCardForm").then(m => m.StripeAddCardForm), {
  loading: () => <div className="h-64 w-full animate-pulse bg-stone-50 rounded-2xl" />
});

const EditPaymentMethodForm = dynamic(() => import("./EditPaymentMethodForm").then(m => m.EditPaymentMethodForm), {
  loading: () => <div className="h-64 w-full animate-pulse bg-stone-50 rounded-2xl" />
});
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/DropdownMenu";

export function PaymentMethodsList() {
  const { paymentMethods, isLoading, deletePaymentMethod, setDefaultPaymentMethod } = usePaymentMethods();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsEditModalOpen(true);
  };

  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-tight">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {/* Existing Methods */}
          {paymentMethods.map((method) => (
            <PaymentMethodCard 
              key={method.id} 
              method={method} 
              onDelete={() => handleDelete(method.id)}
              onSetDefault={() => handleSetDefault(method.id)}
              onEdit={() => handleEdit(method)}
              isDeleting={deletePaymentMethod.isPending && deletePaymentMethod.variables === method.id}
            />
          ))}

          {/* Add New Card */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="group relative flex flex-col items-center justify-center gap-6 p-8 min-h-[260px] rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/10 hover:bg-stone-50 hover:border-gold/30 transition-all duration-500"
          >
            <div className="p-4 bg-white rounded-full text-stone-300 group-hover:text-gold shadow-sm transition-all duration-500">
              <Plus className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-serif text-xl text-charcoal tracking-wide">Add a card</h4>
              <p className="text-[9px] text-stone-400 max-w-[180px] mx-auto leading-relaxed uppercase tracking-[0.2em]">
                Secure a new payment method.
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Payment Method"
      >
        {isAddModalOpen && (
          <StripeAddCardForm onSuccess={() => setIsAddModalOpen(false)} />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMethod(null);
        }}
        title="Edit Payment Method"
      >
        {isEditModalOpen && editingMethod && (
          <EditPaymentMethodForm 
            method={editingMethod} 
            onSuccess={() => {
              setIsEditModalOpen(false);
              setEditingMethod(null);
            }} 
          />
        )}
      </Modal>
    </div>
  );
}

function PaymentMethodCard({ 
  method, 
  onDelete, 
  onSetDefault,
  onEdit,
  isDeleting 
}: { 
  method: PaymentMethod; 
  onDelete: () => void;
  onSetDefault: () => void;
  onEdit: () => void;
  isDeleting: boolean;
}) {
  const isCard = method.type === "CARD";
  
  // Luxury Card Brand Logo helper
  const renderBrandLogo = () => {
    const brand = method.brand?.toLowerCase();
    if (brand === "visa") {
      return (
        <div className="bg-white px-2 py-1 rounded shadow-sm border border-stone-50">
          <span className="text-[#1A1F71] font-bold italic text-lg tracking-tighter">VISA</span>
        </div>
      );
    }
    if (brand === "mastercard") {
      return (
        <div className="flex -space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#EB001B] opacity-90" />
          <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90" />
        </div>
      );
    }
    return <CreditCard className="h-6 w-6 text-stone-300" strokeWidth={1.5} />;
  };

  return (
    <div className="relative group bg-[#fcfaf6] p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between min-h-[260px] transition-all duration-500 hover:shadow-md hover:border-gold/20">
      
      {/* Top Header: Brand + Default Badge */}
      <div className="flex items-start justify-between mb-auto">
        <div className="space-y-4">
          {renderBrandLogo()}
        </div>

        <div className="flex items-center gap-2">
          {method.isDefault && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gold text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm">
              <Star className="h-2.5 w-2.5 fill-current" />
              Default
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-stone-400 hover:text-charcoal transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!method.isDefault && (
                <DropdownMenuItem onClick={onSetDefault} className="text-[10px] font-bold uppercase tracking-widest py-3">
                  Set as Primary
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={onDelete} 
                disabled={isDeleting || method.isDefault}
                className="text-[10px] font-bold uppercase tracking-widest text-burgundy py-3"
              >
                {isDeleting ? "Removing..." : "Remove Card"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Middle: Card Number Mask */}
      <div className="my-8 space-y-2">
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">
          Card Number
        </p>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-1">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                ))}
              </div>
            ))}
          </div>
          <span className="text-2xl sm:text-3xl text-charcoal font-medium tracking-tight font-sans">
            {method.last4}
          </span>
        </div>
      </div>

      {/* Bottom: Expiry + Edit Link */}
      <div className="pt-6 border-t border-stone-100/50 flex items-end justify-between mt-auto">
        <div className="space-y-1.5">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.15em]">
            Expires
          </p>
          <p className="text-sm text-charcoal font-medium tracking-wide">
            {method.expiryDisplay || "MM/YY"}
          </p>
        </div>

        <button 
          className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 hover:text-gold transition-colors underline-offset-4 hover:underline"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
