import { IBnplTransactionRepository } from "../../domain/repositories/bnpl-transaction.repository";
import { IPaymentIntentRepository } from "../../domain/repositories/payment-intent.repository";
import { IExternalOrderQueryPort } from "../../domain/external-services";
import {
  BnplTransaction,
  BnplTransactionDTO,
  BnplPlan,
} from "../../domain/entities/bnpl-transaction.entity";
import { BnplTransactionId } from "../../domain/value-objects/bnpl-transaction-id.vo";
import { PaymentIntentId } from "../../domain/value-objects/payment-intent-id.vo";
import { BnplProvider } from "../../domain/value-objects/bnpl-provider.vo";
import {
  PaymentIntentNotFoundError,
  BnplTransactionNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/payment-loyalty.errors";

export type { BnplTransactionDTO } from "../../domain/entities/bnpl-transaction.entity";

interface CreateBnplTransactionParams {
  intentId: string;
  provider: string;
  plan: BnplPlan;
  userId?: string;
}

export class BnplTransactionService {
  constructor(
    private readonly paymentIntentRepo: IPaymentIntentRepository,
    private readonly orderQueryPort: IExternalOrderQueryPort,
    private readonly bnplTxnRepo: IBnplTransactionRepository,
  ) {}

  private async assertIntentOwnership(intentId: PaymentIntentId, userId?: string): Promise<void> {
    if (!userId) return;

    const intent = await this.paymentIntentRepo.findById(intentId);
    if (!intent) {
      throw new PaymentIntentNotFoundError(intentId.getValue());
    }

    const orderId = intent.orderId;
    if (!orderId) return;

    const order = await this.orderQueryPort.findOrderOwner(orderId);
    if (order?.userId && order.userId !== userId) {
      throw new InvalidOperationError(
        "Forbidden: BNPL transaction does not belong to this user",
      );
    }
  }

  async createBnplTransaction(params: CreateBnplTransactionParams): Promise<BnplTransactionDTO> {
    const intentId = PaymentIntentId.fromString(params.intentId);
    await this.assertIntentOwnership(intentId, params.userId);

    const transaction = BnplTransaction.create({
      intentId,
      provider: BnplProvider.create(params.provider),
      plan: params.plan,
    });

    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async approveBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) throw new BnplTransactionNotFoundError(bnplId);

    await this.assertIntentOwnership(transaction.intentId, userId);
    transaction.approve();
    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async rejectBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) throw new BnplTransactionNotFoundError(bnplId);

    await this.assertIntentOwnership(transaction.intentId, userId);
    transaction.reject();
    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async activateBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) throw new BnplTransactionNotFoundError(bnplId);

    await this.assertIntentOwnership(transaction.intentId, userId);
    transaction.activate();
    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async completeBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) throw new BnplTransactionNotFoundError(bnplId);

    await this.assertIntentOwnership(transaction.intentId, userId);
    transaction.complete();
    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async cancelBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) throw new BnplTransactionNotFoundError(bnplId);

    await this.assertIntentOwnership(transaction.intentId, userId);
    transaction.cancel();
    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async failBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) throw new BnplTransactionNotFoundError(bnplId);

    await this.assertIntentOwnership(transaction.intentId, userId);
    transaction.fail();
    await this.bnplTxnRepo.save(transaction);
    return BnplTransaction.toDTO(transaction);
  }

  async getBnplTransaction(bnplId: string, userId?: string): Promise<BnplTransactionDTO | null> {
    const transaction = await this.bnplTxnRepo.findById(BnplTransactionId.fromString(bnplId));
    if (!transaction) return null;
    await this.assertIntentOwnership(transaction.intentId, userId);
    return BnplTransaction.toDTO(transaction);
  }

  async getBnplTransactionByIntentId(intentId: string, userId?: string): Promise<BnplTransactionDTO | null> {
    const intentIdVO = PaymentIntentId.fromString(intentId);
    const transaction = await this.bnplTxnRepo.findByIntentId(intentIdVO);
    if (!transaction) return null;
    await this.assertIntentOwnership(transaction.intentId, userId);
    return BnplTransaction.toDTO(transaction);
  }

  async getBnplTransactionsByOrderId(orderId: string, userId?: string): Promise<BnplTransactionDTO[]> {
    const transactions = await this.bnplTxnRepo.findByOrderId(orderId);
    const result: BnplTransactionDTO[] = [];
    for (const t of transactions) {
      await this.assertIntentOwnership(t.intentId, userId);
      result.push(BnplTransaction.toDTO(t));
    }
    return result;
  }
}
