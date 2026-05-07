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
    <div className="max-w-6xl space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h1 className="font-serif text-5xl text-charcoal leading-tight">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-stone-100 divide-x divide-y divide-stone-100 bg-white shadow-sm">
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
            className="group relative flex flex-col items-center justify-center gap-6 p-12 min-h-[320px] bg-stone-50/20 hover:bg-white transition-all duration-700"
          >
            <div className="p-5 bg-white rounded-full text-stone-300 group-hover:text-gold shadow-sm transition-all duration-700">
              <Plus className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-serif text-2xl text-charcoal tracking-wide">Add destination</h4>
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
    <div className="group relative bg-white p-10 flex flex-col justify-between min-h-[320px] transition-all duration-500">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
             {address.isDefault && (
               <div className="flex items-center gap-2 text-[8px] font-bold text-gold uppercase tracking-[0.2em]">
                 <CheckCircle2 className="h-3 w-3" /> Default Shipping
               </div>
             )}
             <h3 className="font-serif text-3xl text-charcoal pt-2 italic">
               {address.firstName} {address.lastName}
             </h3>
             <p className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.2em]">
               {address.type} Destination
             </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-stone-600 leading-relaxed font-medium">
            {address.addressLine1}
            {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
            <span className="block">{address.city}, {address.state} {address.postalCode}</span>
          </p>
          <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-4 uppercase tracking-[0.2em] font-bold">
             <Globe className="h-3.5 w-3.5" />
             {address.country}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 pt-10 border-t border-stone-50 mt-10">
        <button 
          onClick={onEdit}
          className="text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400 hover:text-gold transition-colors flex items-center gap-2 group/btn"
        >
          <Edit3 className="h-3 w-3" /> 
          Edit
        </button>
        <button 
          onClick={() => onDelete()}
          disabled={isDeleting || address.isDefault}
          className={cn(
            "text-[9px] font-bold uppercase tracking-[0.25em] transition-colors flex items-center gap-2 group/btn",
            address.isDefault 
              ? "text-stone-100 cursor-not-allowed" 
              : "text-stone-400 hover:text-burgundy"
          )}
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Remove
        </button>
      </div>
    </div>
  );
}
