/**
 * Auth section skeleton — shows while Next.js loads sign-in, sign-up,
 * forgot-password, etc. The marketing header/footer stay mounted via
 * the (auth) layout.
 */
export default function AuthLoading() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-full max-w-md space-y-8 animate-pulse px-4">
        {/* Title skeleton */}
        <div className="text-center space-y-4 pb-8 border-b border-stone-100">
          <div className="h-12 w-48 bg-stone-100 rounded mx-auto" />
          <div className="h-3 w-32 bg-stone-50 rounded mx-auto" />
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-stone-100 rounded" />
            <div className="h-12 w-full bg-stone-50 rounded-sm" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 bg-stone-100 rounded" />
            <div className="h-12 w-full bg-stone-50 rounded-sm" />
          </div>
        </div>

        {/* Button skeleton */}
        <div className="h-16 w-full bg-stone-100 rounded-sm" />
      </div>
    </div>
  );
}
