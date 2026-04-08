import { IGiftCardRepository } from "../../domain/repositories/gift-card.repository";
import { IGiftCardTransactionRepository } from "../../domain/repositories/gift-card-transaction.repository";
import { IExternalOrderQueryPort } from "../../domain/external-services";
import { GiftCard } from "../../domain/entities/gift-card.entity";
import { GiftCardTransaction } from "../../domain/entities/gift-card-transaction.entity";
import { Money } from "../../domain/value-objects/money.vo";
import { Currency } from "../../domain/value-objects/currency.vo";
import { GiftCardTransactionType } from "../../domain/value-objects/gift-card-transaction-type.vo";
import {
  GiftCardNotFoundError,
  GiftCardRedemptionError,
  InvalidOperationError,
} from "../../domain/errors/payment-loyalty.errors";

export interface CreateGiftCardDto {
  code: string;
  initialBalance: number;
  currency?: string;
  expiresAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

export interface RedeemGiftCardDto {
  giftCardId: string;
  amount: number;
  orderId: string;
  userId?: string;
}

export interface GiftCardDto {
  giftCardId: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  expiresAt: Date | null;
  isActive: boolean;
  status: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  createdAt: Date;
}

export interface GiftCardTransactionDto {
  gcTxnId: string;
  giftCardId: string;
  orderId: string | null;
  amount: number;
  currency: string;
  type: string;
  createdAt: Date;
}

export class GiftCardService {
  constructor(
    private readonly orderQueryPort: IExternalOrderQueryPort,
    private readonly giftCardRepo: IGiftCardRepository,
    private readonly giftCardTxnRepo: IGiftCardTransactionRepository,
  ) {}

  async createGiftCard(dto: CreateGiftCardDto): Promise<GiftCardDto> {
    const currency = Currency.create(dto.currency || "USD");
    const initialAmount = Money.fromAmount(dto.initialBalance, currency);

    const giftCard = GiftCard.create({
      code: dto.code,
      initialAmount,
      expiresAt: dto.expiresAt,
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      message: dto.message,
    });

    // Create initial issue transaction
    const transaction = GiftCardTransaction.create({
      giftCardId: giftCard.id.getValue(),
      orderId: null,
      amount: initialAmount,
      type: GiftCardTransactionType.issue(),
    });

    await this.giftCardRepo.save(giftCard);
    await this.giftCardTxnRepo.save(transaction);

    return this.toGiftCardDto(giftCard);
  }

  async redeemGiftCard(dto: RedeemGiftCardDto): Promise<GiftCardDto> {
    if (dto.userId) {
      const order = await this.orderQueryPort.findOrderOwner(dto.orderId);
      if (!order) {
        throw new GiftCardRedemptionError(
          "Order not found for gift card redemption",
        );
      }
      if (dto.userId && order.userId && order.userId !== dto.userId) {
        throw new InvalidOperationError(
          "Forbidden: order does not belong to this user",
        );
      }
    }

    const giftCard = await this.giftCardRepo.findById(dto.giftCardId);
    if (!giftCard) {
      throw new GiftCardNotFoundError(dto.giftCardId);
    }

    if (!giftCard.isActive()) {
      throw new GiftCardRedemptionError("Gift card is not active");
    }

    if (giftCard.isExpired()) {
      throw new GiftCardRedemptionError("Gift card has expired");
    }

    const redeemAmount = Money.fromAmount(
      dto.amount,
      giftCard.balance.getCurrency(),
    );

    if (!giftCard.canRedeem(redeemAmount)) {
      throw new InvalidOperationError(
        `Insufficient gift card balance. Available: ${giftCard.balance.getAmount()}, Requested: ${dto.amount}`,
      );
    }

    // Redeem the amount
    giftCard.redeem(redeemAmount);

    // Create redemption transaction
    const transaction = GiftCardTransaction.create({
      giftCardId: giftCard.id.getValue(),
      orderId: dto.orderId,
      amount: redeemAmount,
      type: GiftCardTransactionType.redeem(),
    });

    await this.giftCardRepo.update(giftCard);
    await this.giftCardTxnRepo.save(transaction);

    return this.toGiftCardDto(giftCard);
  }

  async refundGiftCard(
    giftCardId: string,
    amount: number,
    orderId: string,
  ): Promise<GiftCardDto> {
    const giftCard = await this.giftCardRepo.findById(giftCardId);
    if (!giftCard) {
      throw new GiftCardNotFoundError(giftCardId);
    }

    const refundAmount = Money.fromAmount(
      amount,
      giftCard.balance.getCurrency(),
    );

    // Refund the amount
    giftCard.refund(refundAmount);

    // Create refund transaction
    const transaction = GiftCardTransaction.create({
      giftCardId: giftCard.id.getValue(),
      orderId,
      amount: refundAmount,
      type: GiftCardTransactionType.refund(),
    });

    await this.giftCardRepo.update(giftCard);
    await this.giftCardTxnRepo.save(transaction);

    return this.toGiftCardDto(giftCard);
  }

  async getGiftCardByCode(code: string): Promise<GiftCardDto> {
    const giftCard = await this.giftCardRepo.findByCode(code);
    if (!giftCard) {
      throw new GiftCardNotFoundError(code);
    }
    return this.toGiftCardDto(giftCard);
  }

  async getGiftCardById(giftCardId: string): Promise<GiftCardDto> {
    const giftCard = await this.giftCardRepo.findById(giftCardId);
    if (!giftCard) {
      throw new GiftCardNotFoundError(giftCardId);
    }
    return this.toGiftCardDto(giftCard);
  }

  async getGiftCardBalance(codeOrId: string): Promise<number> {
    let giftCard = await this.giftCardRepo.findByCode(codeOrId);
    if (!giftCard) {
      giftCard = await this.giftCardRepo.findById(codeOrId);
    }
    if (!giftCard) {
      throw new GiftCardNotFoundError(codeOrId);
    }
    return giftCard.balance.getAmount();
  }

  async getGiftCardTransactions(
    giftCardId: string,
  ): Promise<GiftCardTransactionDto[]> {
    const transactions =
      await this.giftCardTxnRepo.findByGiftCardId(giftCardId);
    return transactions.map((txn) => this.toGiftCardTransactionDto(txn));
  }

  async cancelGiftCard(giftCardId: string): Promise<GiftCardDto> {
    const giftCard = await this.giftCardRepo.findById(giftCardId);
    if (!giftCard) {
      throw new GiftCardNotFoundError(giftCardId);
    }

    giftCard.cancel();
    await this.giftCardRepo.update(giftCard);

    return this.toGiftCardDto(giftCard);
  }

  private toGiftCardDto(giftCard: GiftCard): GiftCardDto {
    return {
      giftCardId: giftCard.id.getValue(),
      code: giftCard.code,
      initialBalance: giftCard.initialAmount.getAmount(),
      currentBalance: giftCard.balance.getAmount(),
      currency: giftCard.balance.getCurrency().getValue(),
      expiresAt: giftCard.expiresAt || null,
      isActive: giftCard.isActive(),
      status: giftCard.status.getValue(),
      recipientEmail: giftCard.recipientEmail,
      recipientName: giftCard.recipientName,
      message: giftCard.message,
      createdAt: giftCard.createdAt,
    };
  }

  private toGiftCardTransactionDto(
    txn: GiftCardTransaction,
  ): GiftCardTransactionDto {
    return {
      gcTxnId: txn.gcTxnId,
      giftCardId: txn.giftCardId,
      orderId: txn.orderId,
      amount: txn.amount.getAmount(),
      currency: txn.amount.getCurrency().getValue(),
      type: txn.type.getValue(),
      createdAt: txn.createdAt,
    };
  }
}
