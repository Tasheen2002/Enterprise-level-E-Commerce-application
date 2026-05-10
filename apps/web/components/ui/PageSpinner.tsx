/**
 * Server-renderable spinner used by route-level Suspense fallbacks. Pure
 * CSS + inline SVG so the fallback does not pull `lucide-react` into the
 * route segment chunk.
 */
export function PageSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex-1 flex items-center justify-center min-h-[400px] ${className}`}
    >
      <span
        className="inline-block h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
