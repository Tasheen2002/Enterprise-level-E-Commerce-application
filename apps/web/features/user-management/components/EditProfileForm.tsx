"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  updateProfileRequestSchema, 
  type UpdateProfileRequest 
} from "@tasheen/validation/auth";
import { 
  Button, 
  Input, 
  FormField,
  Container
} from "@tasheen/ui";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { Check, Loader2, User, Phone, Calendar, Globe, CreditCard } from "lucide-react";

export function EditProfileForm() {
  const { data: profile, isLoading: isFetching } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const [success, setSuccess] = useState(false);

  // Memoize the `values` object — RHF re-syncs the form whenever `values`
  // is structurally different. Without this, every parent re-render builds
  // a fresh object literal and resets the form mid-typing.
  const formValues = useMemo<UpdateProfileRequest>(
    () => ({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
      title: profile?.title || "",
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
      nationality: profile?.nationality || "",
      residentOf: profile?.residentOf || "",
      currency: profile?.currency || "GBP",
      locale: profile?.locale || "en-GB",
    }),
    [
      profile?.firstName,
      profile?.lastName,
      profile?.phone,
      profile?.title,
      profile?.dateOfBirth,
      profile?.nationality,
      profile?.residentOf,
      profile?.currency,
      profile?.locale,
    ],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileRequestSchema),
    values: formValues,
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile.mutateAsync(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Update failed", err);
    }
  });

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12">
      <header className="space-y-4 text-center pb-12 border-b border-stone-100">
        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-charcoal tracking-tight italic">Portfolio Registry</h2>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-bold leading-relaxed">
          Commissioned Details & Personalization
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-10">
        <div className="grid grid-cols-1 gap-12">
          {/* Identity Section */}
          <div className="space-y-10">
            <h3 className="text-[9px] font-bold tracking-[0.3em] uppercase text-gold flex items-center gap-3 border-b border-stone-100 pb-5">
              <User className="h-4 w-4 stroke-[1.5]" /> Identity Registry
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField id="title" label="Honorific" error={errors.title?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="title"
                  variant="boxed"
                  placeholder="e.g. MR / MS"
                  hasError={Boolean(errors.title)}
                  {...register("title")}
                />
              </FormField>
              <FormField id="firstName" label="Given Name" error={errors.firstName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="firstName"
                  variant="boxed"
                  placeholder="First name"
                  hasError={Boolean(errors.firstName)}
                  {...register("firstName")}
                />
              </FormField>
              <FormField id="lastName" label="Surname" error={errors.lastName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="lastName"
                  variant="boxed"
                  placeholder="Last name"
                  hasError={Boolean(errors.lastName)}
                  {...register("lastName")}
                />
              </FormField>
            </div>
          </div>

          {/* Correspondence Section */}
          <div className="space-y-10">
            <h3 className="text-[9px] font-bold tracking-[0.3em] uppercase text-gold flex items-center gap-3 border-b border-stone-100 pb-5">
              <Phone className="h-4 w-4 stroke-[1.5]" /> Correspondence
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField id="phone" label="Primary Phone" error={errors.phone?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="phone"
                  variant="boxed"
                  placeholder="+44 ..."
                  hasError={Boolean(errors.phone)}
                  {...register("phone")}
                />
              </FormField>

              <FormField id="dateOfBirth" label="Date of Birth" error={errors.dateOfBirth?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="dateOfBirth"
                  type="date"
                  variant="boxed"
                  hasError={Boolean(errors.dateOfBirth)}
                  {...register("dateOfBirth")}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* Location Section */}
            <div className="space-y-10">
              <h3 className="text-[9px] font-bold tracking-[0.3em] uppercase text-gold flex items-center gap-3 border-b border-stone-100 pb-5">
                <Globe className="h-4 w-4 stroke-[1.5]" /> Global Residence
              </h3>
              
              <div className="grid grid-cols-1 gap-8">
                <FormField id="nationality" label="Nationality" error={errors.nationality?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                  <Input
                    id="nationality"
                    variant="boxed"
                    placeholder="e.g. British"
                    hasError={Boolean(errors.nationality)}
                    {...register("nationality")}
                  />
                </FormField>

                <FormField id="residentOf" label="Resident Of" error={errors.residentOf?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                  <Input
                    id="residentOf"
                    variant="boxed"
                    placeholder="e.g. United Kingdom"
                    hasError={Boolean(errors.residentOf)}
                    {...register("residentOf")}
                  />
                </FormField>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="space-y-10">
              <h3 className="text-[9px] font-bold tracking-[0.3em] uppercase text-gold flex items-center gap-3 border-b border-stone-100 pb-5">
                <CreditCard className="h-4 w-4 stroke-[1.5]" /> Preferences
              </h3>
              
              <div className="grid grid-cols-1 gap-8">
                <FormField id="currency" label="Preferred Currency" error={errors.currency?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                  <Input
                    id="currency"
                    variant="boxed"
                    placeholder="GBP"
                    hasError={Boolean(errors.currency)}
                    {...register("currency")}
                  />
                </FormField>
                <FormField id="locale" label="Language (Locale)" error={errors.locale?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                  <Input
                    id="locale"
                    variant="boxed"
                    placeholder="en-GB"
                    hasError={Boolean(errors.locale)}
                    {...register("locale")}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-stone-400">
            {isDirty ? "You have unsaved changes" : "All details up to date"}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {success && (
              <span className="flex items-center gap-2 text-xs text-emerald-600 animate-in fade-in slide-in-from-right-4">
                <Check className="h-4 w-4" /> Changes saved
              </span>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full sm:min-w-[240px] h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md hover:tracking-[0.3em] sm:hover:tracking-[0.5em] transition-all duration-700"
              disabled={!isDirty || isSubmitting}
              isLoading={isSubmitting}
            >
              Update Registry Portfolio
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
