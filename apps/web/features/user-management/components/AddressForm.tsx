"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Button, 
  Input, 
  FormField,
  cn
} from "@tasheen/ui";
import { useAddresses } from "../hooks/useAddresses";
import { Address } from "../types";
import { toast } from "sonner";

const addressFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1, "Address is required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2, "Please enter a 2-letter country code (e.g., US, LK)"),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
  type: z.enum(["shipping", "billing"]),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  initialData?: Address | null;
  onSuccess: () => void;
}

export function AddressForm({ initialData, onSuccess }: AddressFormProps) {
  const { createAddress, updateAddress } = useAddresses();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      company: initialData.company,
      addressLine1: initialData.addressLine1,
      addressLine2: initialData.addressLine2,
      city: initialData.city,
      state: initialData.state,
      postalCode: initialData.postalCode,
      country: initialData.country,
      phone: initialData.phone,
      isDefault: initialData.isDefault,
      type: initialData.type.toLowerCase() as "shipping" | "billing",
    } : {
      type: "shipping",
      isDefault: false,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (initialData) {
        await updateAddress.mutateAsync({ id: initialData.id, input: data });
        toast.success("Address updated successfully");
      } else {
        await createAddress.mutateAsync(data);
        toast.success("New address added to your book");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong saving your address");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-10 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <FormField id="firstName" label="Given Name" error={errors.firstName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="firstName" 
            placeholder="e.g. Eleanor" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("firstName")} 
          />
        </FormField>
        <FormField id="lastName" label="Surname" error={errors.lastName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="lastName" 
            placeholder="e.g. Vance" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("lastName")} 
          />
        </FormField>
      </div>

      <FormField id="company" label="Establishment / Company (Optional)" error={errors.company?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
        <input 
          id="company" 
          placeholder="Slipperze Artisans" 
          className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
          {...register("company")} 
        />
      </FormField>

      <div className="space-y-10">
        <FormField id="addressLine1" label="Primary Address" error={errors.addressLine1?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="addressLine1" 
            placeholder="1000 Fifth Avenue" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("addressLine1")} 
          />
        </FormField>
        <FormField id="addressLine2" label="Suite / Apartment (Optional)" error={errors.addressLine2?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="addressLine2" 
            placeholder="Apt 14B" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("addressLine2")} 
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <FormField id="city" label="City" error={errors.city?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="city" 
            placeholder="New York" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("city")} 
          />
        </FormField>
        <FormField id="state" label="Province" error={errors.state?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="state" 
            placeholder="NY" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("state")} 
          />
        </FormField>
        <FormField id="postalCode" label="Postal Code" error={errors.postalCode?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="postalCode" 
            placeholder="10028" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("postalCode")} 
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <FormField id="country" label="Country (Code)" error={errors.country?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="country" 
            placeholder="US" 
            maxLength={2} 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal uppercase placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("country")} 
          />
        </FormField>
        <FormField id="phone" label="Primary Phone" error={errors.phone?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
          <input 
            id="phone" 
            placeholder="+1 ..." 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none" 
            {...register("phone")} 
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t border-stone-50">
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="isDefault" 
            className="h-4 w-4 rounded border-stone-300 text-charcoal focus:ring-gold"
            {...register("isDefault")} 
          />
          <label htmlFor="isDefault" className="text-sm text-stone-600 font-medium">
            Set as default shipping address
          </label>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Address Type:</p>
          <div className="flex items-center gap-4">
            {["shipping", "billing"].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value={type} 
                  className="h-3 w-3 text-gold focus:ring-gold border-stone-300"
                  {...register("type")} 
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-10">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="h-16 uppercase tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md hover:tracking-[0.5em] transition-all duration-700"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {initialData ? "Verify Changes" : "Register Address"}
        </Button>
      </div>
    </form>
  );
}
