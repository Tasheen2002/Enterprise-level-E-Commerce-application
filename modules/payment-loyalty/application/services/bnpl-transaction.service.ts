import { IBnplTransactionRepository } from "../../domain/repositories/bnpl-transaction.repository";
import { IPaymentIntentRepository } from "../../domain/repositories/payment-intent.repository";
import { IExternalOrderQueryPort } from "../../domain/external-services";
import {
  BnplTransaction,
  BnplPlan,
} from "../../domain/entities/bnpl-transaction.entity";
import {
  PaymentIntentNotFoundError,
  BnplTransactionNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/payment-loyalty.errors";

export interface CreateBnplTransactionDto {
  intentId: string;
  provider: string;
  plan: BnplPlan;
  userId?: string;
}

export interface UpdateBnplStatusDto {
  bnplId: string;
  status: "approved" | "rejected" | "active" | "completed" | "cancelled";
  userId?: string;
}

export interface BnplTransactionDto {
  bnplId: string;
  intentId: string;
  provider: string;
  plan: BnplPlan;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BnplTransactionService {
  constructor(
    private readonly paymentIntentRepo: IPaymentIntentRepository,
    private readonly orderQueryPort: IExternalOrderQueryPort,
    private readonly bnplTxnRepo: IBnplTransactionRepository,
  ) {}

  private async assertIntentOwnership(intentId: string, userId?: string) {
    if (!userId) return;

    const intent = await this.paymentIntentRepo.findById(intentId);

    if (!intent) {
      throw new PaymentIntentNotFoundError(intentId);
    }

    const orderId = intent.orderIdOrNull;
    if (!orderId) return;

    const order = await this.orderQueryPort.findOrderOwner(orderId);

    if (order?.userId && order.userId !== userId) {
      throw new InvalidOperationError(
        "Forbidden: BNPL transaction does not belong to this user",
      );
    }
  }

  async createBnplTransaction(
    dto: CreateBnplTransactionDto,
  ): Promise<BnplTransactionDto> {
    await this.assertIntentOwnership(dto.intentId, dto.userId);

    const transaction = BnplTransaction.create({
      intentId: dto.intentId,
      provider: dto.provider,
      plan: dto.plan,
    });

    await this.bnplTxnRepo.save(transaction);

    return this.toBnplTransactionDto(transaction);
  }

  async approveBnplTransaction(
    bnplId: string,
    userId?: string,
  ): Promise<BnplTransactionDto> {
    const transaction = await this.bnplTxnRepo.findById(bnplId);
    if (!transaction) {
      throw new BnplTransactionNotFoundError(bnplId);
    }

    await this.assertIntentOwnership(transaction.intentId, userId);

    transaction.approve();
    await this.bnplTxnRepo.update(transaction);

    return this.toBnplTransactionDto(transaction);
  }

  async rejectBnplTransaction(
    bnplId: string,
    userId?: string,
  ): Promise<BnplTransactionDto> {
    const transaction = await this.bnplTxnRepo.findById(bnplId);
    if (!transaction) {
      throw new BnplTransactionNotFoundError(bnplId);
    }

    await this.assertIntentOwnership(transaction.intentId, userId);

    transaction.reject();
    await this.bnplTxnRepo.update(transaction);

    return this.toBnplTransactionDto(transaction);
  }

  async activateBnplTransaction(
    bnplId: string,
    userId?: string,
  ): Promise<BnplTransactionDto> {
    const transaction = await this.bnplTxnRepo.findById(bnplId);
    if (!transaction) {
      throw new BnplTransactionNotFoundError(bnplId);
    }

    await this.assertIntentOwnership(transaction.intentId, userId);

    transaction.activate();
    await this.bnplTxnRepo.update(transaction);

    return this.toBnplTransactionDto(transaction);
  }

  async completeBnplTransaction(
    bnplId: string,
    userId?: string,
  ): Promise<BnplTransactionDto> {
    const transaction = await this.bnplTxnRepo.findById(bnplId);
    if (!transaction) {
      throw new BnplTransactionNotFoundError(bnplId);
    }

    await this.assertIntentOwnership(transaction.intentId, userId);

    transaction.complete();
    await this.bnplTxnRepo.update(transaction);

    return this.toBnplTransactionDto(transaction);
  }

  async cancelBnplTransaction(
    bnplId: string,
    userId?: string,
  ): Promise<BnplTransactionDto> {
    const transaction = await this.bnplTxnRepo.findById(bnplId);
    if (!transaction) {
      throw new BnplTransactionNotFoundError(bnplId);
    }

    await this.assertIntentOwnership(transaction.intentId, userId);

    transaction.cancel();
    await this.bnplTxnRepo.update(transaction);

    return this.toBnplTransactionDto(transaction);
  }

  async getBnplTransaction(
    bnplId: string,
    userId?: string,
  ): Promise<BnplTransactionDto | null> {
    const transaction = await this.bnplTxnRepo.findById(bnplId);
    if (!transaction) return null;
    await this.assertIntentOwnership(transaction.intentId, userId);
    return this.toBnplTransactionDto(transaction);
  }

  async getBnplTransactionByIntentId(
    intentId: string,
    userId?: string,
  ): Promise<BnplTransactionDto | null> {
    const transaction = await this.bnplTxnRepo.findByIntentId(intentId);
    if (!transaction) return null;
    await this.assertIntentOwnership(transaction.intentId, userId);
    return this.toBnplTransactionDto(transaction);
  }

  async getBnplTransactionsByOrderId(
    orderId: string,
    userId?: string,
  ): Promise<BnplTransactionDto[]> {
    const transactions = await this.bnplTxnRepo.findByOrderId(orderId);
    const filtered = [];
    for (const t of transactions) {
      await this.assertIntentOwnership(t.intentId, userId);
      filtered.push(t);
    }
    return filtered.map((t) => this.toBnplTransactionDto(t));
  }

  private toBnplTransactionDto(
    transaction: BnplTransaction,
  ): BnplTransactionDto {
    return {
      bnplId: transaction.bnplId,
      intentId: transaction.intentId,
      provider: transaction.provider,
      plan: transaction.plan,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
