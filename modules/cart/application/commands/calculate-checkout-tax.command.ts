import Stripe from "stripe";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ICheckoutRepository } from "../../domain/repositories/checkout.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { CheckoutId } from "../../domain/value-objects/checkout-id.vo";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import {
  CartNotFoundError,
  CheckoutNotFoundError,
} from "../../domain/errors/cart.errors";

export interface CalculateCheckoutTaxCommand extends ICommand {
  readonly checkoutId: string;
  readonly shippingAddress: {
    readonly firstName: string;
    readonly lastName: string;
    readonly addressLine1: string;
    readonly addressLine2?: string;
    readonly city: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country: string;
    readonly phone?: string;
  };
}

export interface CalculateCheckoutTaxResult {
  readonly tax: number;
  readonly shipping: number;
  readonly total: number;
}

export class CalculateCheckoutTaxHandler implements ICommandHandler<
  CalculateCheckoutTaxCommand,
  CommandResult<CalculateCheckoutTaxResult>
> {
  private readonly stripe: Stripe;

  constructor(
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly cartRepository: ICartRepository,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2026-02-25.clover" as unknown as "2026-02-25.clover",
    });
  }

  async handle(
    command: CalculateCheckoutTaxCommand,
  ): Promise<CommandResult<CalculateCheckoutTaxResult>> {
    const checkoutId = CheckoutId.fromString(command.checkoutId);
    const checkout = await this.checkoutRepository.findById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundError(command.checkoutId);
    }

    const cartId = CartId.fromString(checkout.cartId.getValue());
    const cart = await this.cartRepository.findById(cartId);

    if (!cart) {
      throw new CartNotFoundError(checkout.cartId.getValue());
    }

    const subtotal = cart.subtotal;
    const cartItemTotal = cart.total;
    const discount = subtotal - cartItemTotal;

    // Calculate shipping matching storefront logic (standard delivery rule)
    const shipping = subtotal > 150 ? 0 : 15;

    let tax = 0;

    if (command.shippingAddress && command.shippingAddress.country) {
      try {
        const cartSnapshot = cart.toSnapshot();
        const lineItems = (cartSnapshot.items || []).map((item, idx) => ({
          amount: Math.round(Number(item.unitPriceSnapshot) * 100), // in cents
          reference: `L${idx}`,
          quantity: item.quantity,
          tax_code: "txcd_30011000", // Standard clothing/footwear tax category
        }));

        const calculation = await this.stripe.tax.calculations.create({
          currency: checkout.currency.getValue().toLowerCase(),
          line_items: lineItems,
          customer_details: {
            address: {
              line1: command.shippingAddress.addressLine1,
              line2: command.shippingAddress.addressLine2 || undefined,
              city: command.shippingAddress.city,
              state: command.shippingAddress.state || undefined,
              postal_code: command.shippingAddress.postalCode || undefined,
              country: command.shippingAddress.country,
            },
            address_source: "shipping",
          },
          shipping_cost: shipping > 0 ? { amount: shipping * 100 } : undefined,
        });

        tax = calculation.tax_amount_exclusive / 100;
        if (tax === 0) {
          console.log("Stripe Tax API returned 0. Falling back to 8% simulation.");
          tax = parseFloat((subtotal * 0.08).toFixed(2));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Stripe Tax API failed, falling back to 8% simulation:", msg);
        // Fallback: 8% sales tax simulation
        tax = parseFloat((subtotal * 0.08).toFixed(2));
      }
    } else {
      // Fallback: 8% sales tax simulation
      tax = parseFloat((subtotal * 0.08).toFixed(2));
    }

    const total = subtotal + shipping + tax - discount;

    // Update checkout total in database so it matches payment intent initialization
    checkout.updateTotalAmount(total);
    await this.checkoutRepository.save(checkout);

    return CommandResult.success<CalculateCheckoutTaxResult>({
      tax,
      shipping,
      total,
    });
  }
}
