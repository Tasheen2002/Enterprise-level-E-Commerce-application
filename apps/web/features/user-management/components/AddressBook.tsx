"use client";

import { useState } from "react";
import { 
  Plus, 
  MapPin, 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  Globe,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button, cn } from "@tasheen/ui";
import { toast } from "sonner";
import { useAddresses } from "../hooks/useAddresses";
import { Address } from "../types";
import { AddressForm } from "./AddressForm";
import { Modal } from "@/components/ui/Modal";

export function AddressBook() {
  const { addresses, isLoading, deleteAddress, setDefaultAddress } = useAddresses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleDelete = (id: string) => {
    toast("Delete address?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteAddress.mutateAsync(id);
            toast.success("Address removed successfully");
          } catch (err: any) {
            toast.error(err.message || "Failed to remove address");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  return (
    <div className="max-w-6xl space-y-12">
      <header className="space-y-4">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-tight">
          Address Book
        </h1>
        <p className="text-stone-400 max-w-2xl text-sm leading-relaxed">
          Manage your shipping and billing destinations for seamless artisanal deliveries across the globe.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {/* Existing Addresses */}
          {addresses.map((address) => (
            <AddressCard 
              key={address.id} 
              address={address} 
              onEdit={() => setEditingAddress(address)}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => setDefaultAddress.mutate(address.id)}
              isDeleting={deleteAddress.isPending && deleteAddress.variables === address.id}
            />
          ))}

          {/* Add New Card */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="group relative flex flex-col items-center justify-center gap-6 p-8 min-h-[260px] rounded-2xl border-2 border-dashed border-sand/30 bg-cream hover:bg-ivory/20 hover:border-gold/30 transition-all duration-500"
          >
            <div className="p-4 bg-white rounded-full text-stone-300 group-hover:text-gold shadow-sm transition-all duration-500">
              <Plus className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-serif text-xl text-charcoal tracking-wide">Add destination</h4>
              <p className="text-[9px] text-stone-400 max-w-[180px] mx-auto leading-relaxed uppercase tracking-[0.2em]">
                Register a new artisanal delivery point.
              </p>
            </div>
          </button>
        </div>
      )}

      <Modal 
        isOpen={isAddModalOpen || !!editingAddress} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAddress(null);
        }}
        title={editingAddress ? "Edit Address" : "Add New Address"}
      >
        <AddressForm 
          initialData={editingAddress} 
          onSuccess={() => {
            setIsAddModalOpen(false);
            setEditingAddress(null);
          }} 
        />
      </Modal>
    </div>
  );
}

function AddressCard({ 
  address, 
  onEdit, 
  onDelete, 
  onSetDefault,
  isDeleting 
}: { 
  address: Address; 
  onEdit: () => void; 
  onDelete: () => void; 
  onSetDefault: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="relative group bg-ivory p-8 rounded-2xl border border-sand/20 shadow-sm flex flex-col justify-between min-h-[260px] transition-all duration-500 hover:shadow-md hover:border-gold/20">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
             {address.isDefault && (
               <div className="flex items-center gap-1.5 px-3 py-1 bg-gold text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm mb-2 w-fit">
                 <CheckCircle2 className="h-2.5 w-2.5 fill-current" />
                 Primary
               </div>
             )}
             <h3 className="font-serif text-2xl text-charcoal italic tracking-tight leading-none pt-1">
               {address.firstName} {address.lastName}
             </h3>
             <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">
               {address.type} Residence
             </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-stone-600 leading-relaxed font-medium">
            {address.addressLine1}
            {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
            <span className="block">{address.city}, {address.state} {address.postalCode}</span>
          </p>
          <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-3 uppercase tracking-[0.2em] font-bold">
             <Globe className="h-3.5 w-3.5 text-stone-300" />
             {address.country}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 pt-6 mt-6 border-t border-sand/20">
        <button 
          onClick={onEdit}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-gold transition-colors underline-offset-4 hover:underline"
        >
          Edit
        </button>
        
        {!address.isDefault ? (
          <button 
            onClick={onSetDefault}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-gold transition-colors"
          >
            Set Default
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            Verified
          </div>
        )}

        <button 
          onClick={() => onDelete()}
          disabled={isDeleting || address.isDefault}
          className={cn(
            "ml-auto p-2 transition-colors duration-500",
            address.isDefault ? "text-stone-100 cursor-not-allowed" : "text-stone-300 hover:text-burgundy"
          )}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 stroke-[1.5]" />}
        </button>
      </div>
    </div>
  );
}
