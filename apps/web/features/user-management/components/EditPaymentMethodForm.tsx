"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck, Calendar } from "lucide-react";
import { Button, cn } from "@tasheen/ui";
import { toast } from "sonner";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { PaymentMethod } from "../types";

const editSchema = z.object({
  expMonth: z.number().min(1).max(12),
  expYear: z.number().min(new Date().getFullYear()),
  isDefault: z.boolean(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditPaymentMethodFormProps {
  method: PaymentMethod;
  onSuccess: () => void;
}

export function EditPaymentMethodForm({ method, onSuccess }: EditPaymentMethodFormProps) {
  const { updatePaymentMethod } = usePaymentMethods();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      expMonth: method.expMonth || 1,
      expYear: method.expYear || new Date().getFullYear(),
      isDefault: method.isDefault,
    },
  });

  const onSubmit = async (values: EditFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePaymentMethod.mutateAsync({
        id: method.id,
        input: values,
      });
      toast.success("Card details updated");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
      <div className="bg-stone-50/50 p-6 rounded-xl border border-stone-100 flex items-center gap-4 mb-8">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-stone-100">
           <span className="text-charcoal font-bold italic tracking-tighter">{method.brand?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-xs font-serif text-charcoal tracking-wide">
            Ending in {method.last4}
          </p>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
            Saved Payment Method
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Expiry Month
          </label>
          <select
            {...register("expMonth", { valueAsNumber: true })}
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-sm focus:border-gold outline-none transition-all appearance-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Expiry Year
          </label>
          <select
            {...register("expYear", { valueAsNumber: true })}
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-sm focus:border-gold outline-none transition-all appearance-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!method.isDefault && (
        <label className="flex items-center gap-3 p-4 rounded-xl border border-stone-100 bg-white hover:bg-stone-50 cursor-pointer transition-colors group">
          <input
            type="checkbox"
            {...register("isDefault")}
            className="w-4 h-4 rounded border-stone-300 text-gold focus:ring-gold"
          />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-charcoal uppercase tracking-widest">Set as primary method</p>
            <p className="text-[10px] text-stone-400">Use this card for future artisanal orders.</p>
          </div>
        </label>
      )}

      <div className="pt-6 flex flex-col gap-4">
        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting}
          className="h-14 tracking-[0.2em] font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Update Card Details"
          )}
        </Button>
        <div className="flex items-center justify-center gap-2 text-[9px] text-stone-400 font-bold uppercase tracking-[0.2em]">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Secured by Stripe Infrastructure
        </div>
      </div>
    </form>
  );
}
