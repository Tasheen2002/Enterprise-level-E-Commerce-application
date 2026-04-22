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
} from "../../domain/errors/payment-loyalty.errors";

interface CreatePaymentIntentParams {
  orderId?: string;
  checkoutId?: string;
  provider: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  clientSecret?: string;
  userId?: string;
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

export class PaymentService {
  constructor(
    private readonly orderQueryPort: IExternalOrderQueryPort,
    private readonly paymentIntentRepository: IPaymentIntentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
  ) {}

  private async assertOrderOwnership(orderId: string, userId?: string): Promise<void> {
    const order = await this.orderQueryPort.findOrderOwner(orderId);
    if (!order) return;
    if (userId && order.userId && order.userId !== userId) {
      throw new InvalidOperationError("Forbidden: you do not own this order");
    }
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentDTO> {
    if (params.orderId && params.userId) {
      await this.assertOrderOwnership(params.orderId, params.userId);
    }

    if (params.checkoutId) {
      const existing = await this.paymentIntentRepository.findByCheckoutId(params.checkoutId);
      if (existing) return PaymentIntent.toDTO(existing);
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

    await this.paymentIntentRepository.save(intent);
    return PaymentIntent.toDTO(intent);
  }

  async authorizePayment(params: AuthorizePaymentParams): Promise<PaymentIntentDTO> {
    const intent = await this.paymentIntentRepository.findById(
      PaymentIntentId.fromString(params.intentId),
    );
    if (!intent) throw new PaymentIntentNotFoundError(params.intentId);

    if (intent.orderId && params.userId) {
      await this.assertOrderOwnership(intent.orderId, params.userId);
    }

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

    if (intent.orderId && userId) {
      await this.assertOrderOwnership(intent.orderId, userId);
    }

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

    if (intent.orderId && params.userId) {
      await this.assertOrderOwnership(intent.orderId, params.userId);
    }

    if (!intent.isCaptured()) {
      throw new InvalidOperationError(
        `Cannot refund payment with status ${intent.status.getValue()}`,
      );
    }

    const refundAmount = params.amount
      ? Money.fromAmount(params.amount, intent.amount.getCurrency())
      : intent.amount;

    const transaction = PaymentTransaction.create({
      intentId: intent.id,
      type: PaymentTransactionType.refund(),
      amount: refundAmount,
      pspReference: null,
      failureReason: null,
    });
    transaction.markAsSucceeded('');

    intent.cancel();
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

    if (intent.orderId && params.userId) {
      await this.assertOrderOwnership(intent.orderId, params.userId);
    }

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
    if (intent.orderId && userId) {
      await this.assertOrderOwnership(intent.orderId, userId);
    }
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

    if (intent.orderId && userId) {
      await this.assertOrderOwnership(intent.orderId, userId);
    }

    const transactions = await this.paymentTransactionRepository.findByIntentId(
      PaymentIntentId.fromString(intentId),
    );
    return transactions.map((txn) => PaymentTransaction.toDTO(txn));
  }
}
