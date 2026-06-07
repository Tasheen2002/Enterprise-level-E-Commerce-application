"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useOrderByNumber } from "@/features/orders/hooks/useOrders";
import { Button } from "@tasheen/ui";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { toast } from "sonner";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("orderNumber") || "";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { data: order, isLoading, error } = useOrderByNumber(orderNumber);

  // Confetti Simulation effect for wow factor
  useEffect(() => {
    if (isLoading || error || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#d4af37", "#f3ebd6", "#333333", "#a8a29e", "#d6d3d1"];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      // Keep animation alive for 5 seconds
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const timer = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoading, error]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <PageSpinner />
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Locating your archives...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 bg-stone-50 border border-stone-100 p-8 max-w-lg mx-auto my-12">
        <h2 className="text-lg font-light text-stone-850 tracking-wide mb-4 uppercase">Archive Retrieval Error</h2>
        <p className="text-xs text-stone-500 mb-8 font-light leading-relaxed">
          We could not resolve an order matching the code <strong className="text-stone-700">{orderNumber || "N/A"}</strong>. Please verify the receipt ID or contact concierge support.
        </p>
        <Button
          variant="primary"
          onClick={() => router.push("/catalog")}
          className="uppercase tracking-[0.2em] text-[10px] font-bold h-12"
        >
          Return to Catalog
        </Button>
      </div>
    );
  }

  const subtotal = order.totals.subtotal;
  const shipping = order.totals.shipping;
  const tax = order.totals.tax;
  const discount = order.totals.discount;
  const total = order.totals.total;

  return (
    <div className="relative max-w-4xl mx-auto w-full space-y-12">
      {/* Canvas for confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50 w-full h-full" />

      {/* Celebratory message */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-light text-stone-855 uppercase tracking-[0.2em]">
          Acknowledgment Confirmed
        </h1>
        <p className="text-[11px] text-stone-400 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
          Your order has been registered into our system. Thank you for acquiring a Slipperze creation.
        </p>
      </div>

      {/* Printable Receipt layout */}
      <div className="p-8 bg-stone-50 border border-stone-200 space-y-8 print:border-none print:bg-white print:p-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-200">
          <div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Order Number</span>
            <h2 className="text-lg font-mono font-semibold text-stone-800 mt-1">{order.orderNumber}</h2>
          </div>
          <div className="sm:text-right">
            <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Registered Date</span>
            <p className="text-xs text-stone-600 font-light mt-1">
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Deliver address snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-stone-200">
          <div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Recipient Details</span>
            <div className="text-[11px] text-stone-600 mt-2 leading-relaxed">
              {order.address?.shippingAddress.firstName} {order.address?.shippingAddress.lastName}<br />
              {order.address?.shippingAddress.addressLine1}<br />
              {order.address?.shippingAddress.addressLine2 && `${order.address?.shippingAddress.addressLine2}, `}
              {order.address?.shippingAddress.city}, {order.address?.shippingAddress.state} {order.address?.shippingAddress.postalCode}<br />
              {order.address?.shippingAddress.country}
            </div>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Billing Verification</span>
            <div className="text-[11px] text-stone-600 mt-2 leading-relaxed">
              {order.address?.billingAddress.firstName} {order.address?.billingAddress.lastName}<br />
              {order.address?.billingAddress.addressLine1}<br />
              {order.address?.billingAddress.addressLine2 && `${order.address?.billingAddress.addressLine2}, `}
              {order.address?.billingAddress.city}, {order.address?.billingAddress.state} {order.address?.billingAddress.postalCode}<br />
              {order.address?.billingAddress.country}
            </div>
          </div>
        </div>

        {/* Ordered Item list details */}
        <div>
          <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400 block mb-4">Acquired Creations</span>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.orderItemId || item.variantId} className="flex justify-between items-center gap-4 py-2">
                <div className="min-w-0">
                  <h4 className="text-[11px] font-medium text-stone-850 uppercase tracking-wide truncate">
                    {item.productSnapshot.name}
                  </h4>
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mt-1">
                    SKU: {item.productSnapshot.sku} | Quantity: {item.quantity}
                  </p>
                  {item.isGift && (
                    <div className="mt-1 p-2 bg-stone-100 border border-stone-200 border-dashed text-[10px] text-stone-500 italic">
                      Gift message: "{item.giftMessage || 'With compliments.'}"
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] font-medium text-stone-800">
                    ${(item.productSnapshot.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing financial figures summary */}
        <div className="pt-6 border-t border-stone-200 flex flex-col items-end space-y-3">
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-light">Subtotal</span>
              <span className="text-stone-855 font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-light">Delivery Fee</span>
              <span className="text-stone-850 font-medium">
                {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-gold font-bold">
                <span>Promotional Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-light">Estimated Sales Tax</span>
              <span className="text-stone-855 font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="h-[1px] bg-stone-200 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-stone-800 uppercase tracking-widest font-bold">Paid Total</span>
              <span className="text-stone-855 font-bold text-md">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center print:hidden pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/track?orderNumber=${order.orderNumber}&contact=${order.address?.shippingAddress.email || ""}`)}
          className="uppercase tracking-[0.2em] text-[10px] font-bold h-14 w-full sm:w-60 rounded-none"
        >
          Track Shipment State
        </Button>
        <Button
          variant="primary"
          onClick={handlePrint}
          className="uppercase tracking-[0.2em] text-[10px] font-bold h-14 w-full sm:w-60 rounded-none"
        >
          Print Tax Invoice
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Parisian Heritage solid header */}
      <MarketingHeader variant="solid" showSearch={false} />

      {/* Main Confirmation Content */}
      <main className="flex-grow px-6 pb-6 pt-2 sm:px-10 sm:pb-10 sm:pt-4 lg:px-16 lg:pb-16 lg:pt-6 min-h-[500px]">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <PageSpinner />
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Loading Order Confirmation...</p>
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </main>

      {/* Parisian Heritage solid footer */}
      <MarketingFooter />
    </div>
  );
}
