import type { IPaymentRefundGateway } from "../../domain/external-services";
import { IPaymentIntentRepository } from "../../domain/repositories/payment-intent.repository";
import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";
import { IExternalOrderQueryPort } from "../../domain/external-services";
import { PaymentIntent, PaymentIntentDTO } from "../../domain/entities/payment-intent.entity";
import { PaymentTransaction, PaymentTransactionDTO } from "../../domain/entities/payment-transaction.entity";
import { PaymentIntentId } from "../../domain/value-objects/payment-intent-id.vo";
import { PaymentTransactionId } from "../../domain/value-objects/payment-transaction-id.vo";
import { Money } from "../../domain/value-objects/money.vo";
import { PaymentTransactionType } from "../../domain/value-objects/payment-transaction-type.vo";
import {
  PaymentIntentNotFoundError,
  InvalidOperationError,
} from "../../domain/errors";

interface CreatePaymentIntentParams {
  orderId?: string;
  checkoutId?: string;
  provider: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  clientSecret?: string;
  userId?: string;
  /** Guest checkout identity (x-guest-token) for checkout payments. */
  guestToken?: string;
  metadata?: Record<string, unknown>;
}

interface AuthorizePaymentParams {
  intentId: string;
  pspReference?: string;
  userId?: string;
}

interface RefundPaymentParams {
  intentId: string;
  amount?: number;
  reason?: string;
  userId?: string;
}

interface VoidPaymentParams {
  intentId: string;
  pspReference?: string;
  userId?: string;
}

// Providers that hold the customer's money: refunds must be issued through them.
const ONLINE_PAYMENT_PROVIDERS: ReadonlySet<string> = new Set([
  "stripe",
  "paypal",
  "razorpay",
  "klarna",
  "afterpay",
]);

export class PaymentService {
  constructor(
    private readonly orderQueryPort: IExternalOrderQueryPort,
    private readonly paymentIntentRepository: IPaymentIntentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    private readonly refundGateway?: IPaymentRefundGateway,
  ) {}

  // Ownership is fail-closed for customers: `userId` is the signed-in
  // customer. Staff and internal callers (webhooks, checkout) pass no userId.
  private async assertOrderOwnership(orderId: string, userId?: string): Promise<void> {
    if (userId === undefined) return;
    const order = await this.orderQueryPort.findOrderOwner(orderId);
    if (!order || order.userId !== userId) {
      throw new InvalidOperationError("Forbidden: you do not own this order");
    }
  }

  // A customer may only see or act on payments of orders they own; payments
  // not yet attached to an order are reported as not found.
  private async assertCustomerOwnsIntent(intent: PaymentIntent, userId?: string): Promise<void> {
    if (userId === undefined) return;
    if (!intent.orderId) throw new PaymentIntentNotFoundError(intent.id.getValue());
    const order = await this.orderQueryPort.findOrderOwner(intent.orderId);
    if (!order || order.userId !== userId) {
      throw new PaymentIntentNotFoundError(intent.id.getValue());
    }
  }

  // A checkout payment may only be created by that checkout's owner (signed-in
  // customer or guest token) while the checkout is still open. Otherwise anyone
  // knowing a checkout id could replace its payment and block the real buyer.
  private async assertCheckoutAccess(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<void> {
    const owner = await this.orderQueryPort.findCheckoutOwner(checkoutId);
    if (!owner) throw new InvalidOperationError("Checkout not found");
    const ownsIt = owner.userId
      ? owner.userId === userId
      : owner.guestToken !== null && owner.guestToken === guestToken;
    if (!ownsIt) throw new InvalidOperationError("Forbidden: you do not own this checkout");
    if (owner.status !== "pending") {
      throw new InvalidOperationError("Checkout is no longer open for payment");
    }
  }

  private activeCreates: Map<string, Promise<PaymentIntentDTO>> = new Map();

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentDTO> {
    if (params.checkoutId) {
      const active = this.activeCreates.get(params.checkoutId);
      if (active) return active;
    }

    const promise = this.doCreatePaymentIntent(params);

    if (params.checkoutId) {
      const checkoutId = params.checkoutId;
      this.activeCreates.set(checkoutId, promise);
      // Clean up on both outcomes without creating a second promise that
      // rejects unobserved: promise.finally() would, and Node treats an
      // unhandled rejection as fatal, so a refused request could stop the API.
      const clear = () => {
        this.activeCreates.delete(checkoutId);
      };
      promise.then(clear, clear);
    }

    return promise;
  }

  private async doCreatePaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentDTO> {
    if (params.orderId && params.userId) {
      await this.assertOrderOwnership(params.orderId, params.userId);
    }

    if (params.checkoutId) {
      await this.assertCheckoutAccess(params.checkoutId, params.userId, params.guestToken);
      const existing = await this.paymentIntentRepository.findByCheckoutId(params.checkoutId);
      if (existing) {
        if (existing.amount.getAmount() !== params.amount) {
          existing.updateAmount(params.amount);
          await this.paymentIntentRepository.save(existing);
        }
        return PaymentIntent.toDTO(existing);
      }
    }

    const intent = PaymentIntent.create({
      orderId: params.orderId,
      checkoutId: params.checkoutId,
      provider: params.provider,
      amount: params.amount,
      currency: params.currency ?? "USD",
      idempotencyKey: params.idempotencyKey,
      clientSecret: params.clientSecret,
      metadata: params.metadata,
    });

    try {
      await this.paymentIntentRepository.save(intent);
    } catch (error: unknown) {
      if (params.checkoutId) {
        const existing = await this.paymentIntentRepository.findByCheckoutId(params.checkoutId);
        if (existing) return PaymentIntent.toDTO(existing);
      }
      if (params.idempotencyKey) {
        const existing = await this.paymentIntentRepository.findByIdempotencyKey(params.idempotencyKey);
        if (existing) return PaymentIntent.toDTO(existing);
      }
      throw error;
    }
    return PaymentIntent.toDTO(intent);
  }

  async authorizePayment(params: AuthorizePaymentParams): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(params.intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(params.intentId);

    await this.assertCustomerOwnsIntent(intent, params.userId);

    intent.authorize();

    const transaction = PaymentTransaction.create({
      intentId: intent.id,
      type: PaymentTransactionType.auth(),
      amount: intent.amount,
      pspReference: params.pspReference ?? null,
      failureReason: null,
    });
    transaction.markAsSucceeded(params.pspReference ?? '');

    await this.paymentIntentRepository.save(intent);
    await this.paymentTransactionRepository.save(transaction);
    return PaymentIntent.toDTO(intent);
  }

  async capturePayment(intentId: string, pspReference?: string, userId?: string): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(intentId);

    await this.assertCustomerOwnsIntent(intent, userId);

    intent.capture();

    const transaction = PaymentTransaction.create({
      intentId: intent.id,
      type: PaymentTransactionType.capture(),
      amount: intent.amount,
      pspReference: pspReference ?? null,
      failureReason: null,
    });
    transaction.markAsSucceeded(pspReference ?? '');

    await this.paymentIntentRepository.save(intent);
    await this.paymentTransactionRepository.save(transaction);
    return PaymentIntent.toDTO(intent);
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(params.intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(params.intentId);

    await this.assertCustomerOwnsIntent(intent, params.userId);

    if (!intent.isCaptured()) {
      throw new InvalidOperationError(
        `Cannot refund payment with status ${intent.status.getValue()}`,
      );
    }

    // Never refund more than was collected, including earlier partial refunds.
    const round2 = (value: number) => Math.round(value * 100) / 100;
    const previousRefunds = (await this.paymentTransactionRepository.findByIntentId(intent.id))
      .filter((t) => t.type.getValue() === "refund" && t.status.getValue() === "succeeded")
      .reduce((sum, t) => sum + t.amount.getAmount(), 0);
    const remaining = round2(intent.amount.getAmount() - previousRefunds);
    const amount = round2(params.amount ?? remaining);
    if (amount <= 0 || amount > remaining) {
      throw new InvalidOperationError(
        `Refund amount must be between 0.01 and the remaining ${remaining.toFixed(2)}`,
      );
    }

    // Money goes back through the provider that collected it. Payments taken
    // offline (cash, bank transfer, manual) are recorded without a provider.
    let providerRefundId: string | null = null;
    if (ONLINE_PAYMENT_PROVIDERS.has(intent.provider.toLowerCase())) {
      if (!this.refundGateway || !intent.clientSecret) {
        throw new InvalidOperationError(
          `Refunds for ${intent.provider} payments cannot be issued: provider not configured`,
        );
      }
      providerRefundId = (
        await this.refundGateway.refund({
          provider: intent.provider,
          providerReference: intent.clientSecret,
          amount,
          currency: intent.amount.getCurrency().getValue(),
        })
      ).reference;
    }

    const transaction = PaymentTransaction.create({
      intentId: intent.id,
      type: PaymentTransactionType.refund(),
      amount: Money.fromAmount(amount, intent.amount.getCurrency()),
      pspReference: providerRefundId,
      failureReason: null,
    });
    transaction.markAsSucceeded(providerRefundId ?? '');

    // The payment stays captured (as at the provider); refunds are recorded
    // as transactions and the remaining refundable amount is derived from them.
    await this.paymentIntentRepository.save(intent);
    await this.paymentTransactionRepository.save(transaction);
    return PaymentIntent.toDTO(intent);
  }

  async cancelPayment(intentId: string): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(intentId);

    intent.cancel();
    await this.paymentIntentRepository.save(intent);
    return PaymentIntent.toDTO(intent);
  }

  async voidPayment(params: VoidPaymentParams): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(params.intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(params.intentId);

    await this.assertCustomerOwnsIntent(intent, params.userId);

    if (intent.isCaptured()) {
      throw new InvalidOperationError("Cannot void a captured payment; use refund instead");
    }

    intent.cancel();

    const transaction = PaymentTransaction.create({
      intentId: intent.id,
      type: PaymentTransactionType.void(),
      amount: intent.amount,
      pspReference: params.pspReference ?? null,
      failureReason: null,
    });
    transaction.markAsSucceeded(params.pspReference ?? '');

    await this.paymentIntentRepository.save(intent);
    await this.paymentTransactionRepository.save(transaction);
    return PaymentIntent.toDTO(intent);
  }

  async updatePaymentIntent(
    intentId: string,
    data: { clientSecret?: string },
  ): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(intentId);

    if (data.clientSecret) {
      intent.updateClientSecret(data.clientSecret);
    }

    await this.paymentIntentRepository.save(intent);
    return PaymentIntent.toDTO(intent);
  }

  async failPayment(intentId: string, failureReason: string): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(intentId);

    intent.fail();

    const transaction = PaymentTransaction.create({
      intentId: intent.id,
      type: PaymentTransactionType.auth(),
      amount: intent.amount,
      pspReference: null,
      failureReason,
    });
    transaction.markAsFailed(failureReason);

    await this.paymentIntentRepository.save(intent);
    await this.paymentTransactionRepository.save(transaction);
    return PaymentIntent.toDTO(intent);
  }

  async getPaymentIntent(intentId: string, userId?: string): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(intentId);
    await this.assertCustomerOwnsIntent(intent, userId);
    return PaymentIntent.toDTO(intent);
  }

  async getPaymentIntentByClientSecret(clientSecret: string): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findByClientSecret(clientSecret);
    if (!intent) throw new PaymentIntentNotFoundError(clientSecret);
    return PaymentIntent.toDTO(intent);
  }

  async getPaymentIntentByOrderId(orderId: string, userId?: string): Promise<PaymentIntentDTO> {
    const result = await this.paymentIntentRepository.findByOrderId(orderId);
    if (result.length === 0) throw new PaymentIntentNotFoundError(orderId);
    await this.assertOrderOwnership(orderId, userId);
    return PaymentIntent.toDTO(result[0]);
  }

  async getPaymentTransaction(txnId: string): Promise<PaymentTransactionDTO | null> {
    const transaction = await this.paymentTransactionRepository.findById(
      PaymentTransactionId.fromString(txnId),
    );
    return transaction ? PaymentTransaction.toDTO(transaction) : null;
  }

  async getPaymentTransactions(intentId: string, userId?: string): Promise<PaymentTransactionDTO[]> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(intentId);

    await this.assertCustomerOwnsIntent(intent, userId);

    const transactions = await this.paymentTransactionRepository.findByIntentId(
      PaymentIntentId.fromString(intentId),
    );
    return transactions.map((txn) => PaymentTransaction.toDTO(txn));
  }
}
