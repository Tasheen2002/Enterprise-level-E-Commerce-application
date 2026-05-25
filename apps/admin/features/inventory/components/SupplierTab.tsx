import React, { useState } from "react";
import { Supplier, Contact } from "../types";
import { inventoryApi } from "../api";
import { User, Mail, Phone, Plus, PlusCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface SupplierTabProps {
  suppliers: Supplier[];
  onRefresh: () => void;
  onPlaceOrder: (supplierId: string) => void;
}

export function SupplierTab({ suppliers, onRefresh, onPlaceOrder }: SupplierTabProps) {
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [name, setName] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  
  // Contact details
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    const contacts: Contact[] = [];
    if (contactName.trim() || contactEmail.trim() || contactPhone.trim()) {
      contacts.push({
        name: contactName.trim() || undefined,
        email: contactEmail.trim() || undefined,
        phone: contactPhone.trim() || undefined,
      });
    }

    try {
      await inventoryApi.createSupplier(name.trim(), leadTimeDays, contacts.length > 0 ? contacts : undefined);
      toast.success("Supplier registered successfully");
      
      // Reset form
      setName("");
      setLeadTimeDays(7);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setIsCreatingSupplier(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to register supplier");
    }
  };

  return (
    <div>
      {/* Directory Action Header */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsCreatingSupplier(true)}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Register Supplier
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-charcoal/60 bg-white border border-charcoal/10 rounded-xl shadow-sm">
            No registered supplier directories found.
          </div>
        ) : (
          suppliers.map((sup) => {
            const contact = sup.contacts?.[0];
            return (
              <div key={sup.supplierId} className="bg-white border border-charcoal/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-burgundy/30 transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-base font-bold text-charcoal tracking-wide">{sup.name}</h3>
                    <span className="bg-charcoal/5 border border-charcoal/10 px-2 py-0.5 rounded text-[9px] font-bold text-charcoal/60 uppercase tracking-widest">
                      Lead: {sup.leadTimeDays ?? "N/A"} Days
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-charcoal/40 mt-1 uppercase">SUPPLIER ID: {sup.supplierId}</p>

                  <div className="mt-6 border-t border-charcoal/5 pt-4 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50 mb-2">Primary Contact</h4>
                    {contact ? (
                      <div className="space-y-1.5 text-xs text-charcoal/70">
                        {contact.name && (
                          <div className="flex items-center gap-2 font-medium">
                            <User className="w-3.5 h-3.5 text-charcoal/40" />
                            {contact.name}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2 font-mono">
                            <Mail className="w-3.5 h-3.5 text-charcoal/40" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 font-mono">
                            <Phone className="w-3.5 h-3.5 text-charcoal/40" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs italic text-charcoal/30">No contact person recorded</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-charcoal/5 flex justify-end">
                  <button
                    onClick={() => onPlaceOrder(sup.supplierId)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-burgundy uppercase tracking-widest hover:text-charcoal transition-colors"
                  >
                    Place Order
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE SUPPLIER MODAL */}
      {isCreatingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/20 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden border border-charcoal/10 flex flex-col justify-between text-charcoal">
            <div>
              <div className="px-6 py-4 border-b border-charcoal/10 flex items-center justify-between bg-charcoal/[0.02]">
                <h3 className="font-serif text-base font-bold text-charcoal">Register Supplier</h3>
                <button onClick={() => setIsCreatingSupplier(false)} className="text-charcoal/40 hover:text-charcoal font-bold text-lg leading-none">×</button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Manufacturer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Florentine Tanneries S.A."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm font-medium transition-all text-charcoal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Standard Lead Time (Days)</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm font-medium transition-all text-charcoal"
                  />
                </div>

                <div className="border-t border-charcoal/5 pt-4 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Primary Contact Person</h4>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-charcoal/50 uppercase tracking-widest mb-1">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Giovanni Rossi"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-medium transition-all text-charcoal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-charcoal/50 uppercase tracking-widest mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="giovanni@florentine.it"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-medium transition-all text-charcoal"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-charcoal/50 uppercase tracking-widest mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+39 055 123456"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-medium transition-all text-charcoal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-charcoal/10 bg-charcoal/[0.02] flex justify-end gap-2">
              <button
                onClick={() => setIsCreatingSupplier(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal/60 hover:text-charcoal transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-charcoal text-white rounded-full hover:bg-burgundy text-xs font-bold tracking-widest uppercase transition-colors shadow-sm"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
