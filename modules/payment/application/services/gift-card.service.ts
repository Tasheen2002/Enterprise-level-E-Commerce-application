import { IGiftCardRepository } from "../../domain/repositories/gift-card.repository";
import { IGiftCardTransactionRepository } from "../../domain/repositories/gift-card-transaction.repository";
import { IExternalOrderQueryPort } from "../../domain/external-services";
import { GiftCard, GiftCardDTO } from "../../domain/entities/gift-card.entity";
import {
  GiftCardTransaction,
  GiftCardTransactionDTO,
} from "../../domain/entities/gift-card-transaction.entity";
import { GiftCardId } from "../../domain/value-objects/gift-card-id.vo";
import { Money } from "../../domain/value-objects/money.vo";
import { Currency } from "../../domain/value-objects/currency.vo";
import { GiftCardTransactionType } from "../../domain/value-objects/gift-card-transaction-type.vo";
import {
  GiftCardNotFoundError,
  GiftCardRedemptionError,
  InvalidOperationError,
} from "../../domain/errors/payment-loyalty.errors";

export type { GiftCardDTO } from "../../domain/entities/gift-card.entity";

interface CreateGiftCardParams {
  code: string;
  initialBalance: number;
  currency?: string;
  expiresAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

interface RedeemGiftCardParams {
  giftCardId: string;
  amount: number;
  orderId: string;
  userId?: string;
}

export class GiftCardService {
  constructor(
    private readonly orderQueryPort: IExternalOrderQueryPort,
    private readonly giftCardRepo: IGiftCardRepository,
    private readonly giftCardTxnRepo: IGiftCardTransactionRepository,
  ) {}

  async createGiftCard(params: CreateGiftCardParams): Promise<GiftCardDTO> {
    const currency = Currency.create(params.currency || "USD");
    const initialAmount = Money.fromAmount(params.initialBalance, currency);

    const giftCard = GiftCard.create({
      code: params.code,
      initialAmount,
      expiresAt: params.expiresAt,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      message: params.message,
    });

    const transaction = GiftCardTransaction.create({
      giftCardId: giftCard.id,
      orderId: null,
      amount: initialAmount,
      type: GiftCardTransactionType.issue(),
    });

    await this.giftCardRepo.save(giftCard);
    await this.giftCardTxnRepo.save(transaction);

    return GiftCard.toDTO(giftCard);
  }

  async redeemGiftCard(params: RedeemGiftCardParams): Promise<GiftCardDTO> {
    if (params.userId) {
      const order = await this.orderQueryPort.findOrderOwner(params.orderId);
      if (!order) {
        throw new GiftCardRedemptionError("Order not found for gift card redemption");
      }
      if (order.userId && order.userId !== params.userId) {
        throw new InvalidOperationError("Forbidden: order does not belong to this user");
      }
    }

    const giftCard = await this.giftCardRepo.findById(GiftCardId.fromString(params.giftCardId));
    if (!giftCard) throw new GiftCardNotFoundError(params.giftCardId);

    if (!giftCard.isActive()) throw new GiftCardRedemptionError("Gift card is not active");
    if (giftCard.isExpired()) throw new GiftCardRedemptionError("Gift card has expired");

    const redeemAmount = Money.fromAmount(params.amount, giftCard.balance.getCurrency());

    if (!giftCard.canRedeem(redeemAmount)) {
      throw new InvalidOperationError(
        `Insufficient gift card balance. Available: ${giftCard.balance.getAmount()}, Requested: ${params.amount}`,
      );
    }

    giftCard.redeem(redeemAmount);

    const transaction = GiftCardTransaction.create({
      giftCardId: giftCard.id,
      orderId: params.orderId,
      amount: redeemAmount,
      type: GiftCardTransactionType.redeem(),
    });

    await this.giftCardRepo.update(giftCard);
    await this.giftCardTxnRepo.save(transaction);

    return GiftCard.toDTO(giftCard);
  }

  async refundGiftCard(giftCardId: string, amount: number, orderId: string): Promise<GiftCardDTO> {
    const giftCard = await this.giftCardRepo.findById(GiftCardId.fromString(giftCardId));
    if (!giftCard) throw new GiftCardNotFoundError(giftCardId);

    const refundAmount = Money.fromAmount(amount, giftCard.balance.getCurrency());
    giftCard.refund(refundAmount);

    const transaction = GiftCardTransaction.create({
      giftCardId: giftCard.id,
      orderId,
      amount: refundAmount,
      type: GiftCardTransactionType.refund(),
    });

    await this.giftCardRepo.update(giftCard);
    await this.giftCardTxnRepo.save(transaction);

    return GiftCard.toDTO(giftCard);
  }

  async getGiftCardByCode(code: string): Promise<GiftCardDTO> {
    const giftCard = await this.giftCardRepo.findByCode(code);
    if (!giftCard) throw new GiftCardNotFoundError(code);
    return GiftCard.toDTO(giftCard);
  }

  async getGiftCardById(giftCardId: string): Promise<GiftCardDTO> {
    const giftCard = await this.giftCardRepo.findById(GiftCardId.fromString(giftCardId));
    if (!giftCard) throw new GiftCardNotFoundError(giftCardId);
    return GiftCard.toDTO(giftCard);
  }

  async getGiftCardBalance(codeOrId: string): Promise<number> {
    let giftCard = await this.giftCardRepo.findByCode(codeOrId);
    if (!giftCard) {
      giftCard = await this.giftCardRepo.findById(GiftCardId.fromString(codeOrId));
    }
    if (!giftCard) throw new GiftCardNotFoundError(codeOrId);
    return giftCard.balance.getAmount();
  }

  async getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransactionDTO[]> {
    const transactions = await this.giftCardTxnRepo.findByGiftCardId(
      GiftCardId.fromString(giftCardId),
    );
    return transactions.map((txn) => GiftCardTransaction.toDTO(txn));
  }

  async getGiftCardTransactionsByOrderId(orderId: string): Promise<GiftCardTransactionDTO[]> {
    const transactions = await this.giftCardTxnRepo.findByOrderId(orderId);
    return transactions.map((txn) => GiftCardTransaction.toDTO(txn));
  }

  async cancelGiftCard(giftCardId: string): Promise<GiftCardDTO> {
    const giftCard = await this.giftCardRepo.findById(GiftCardId.fromString(giftCardId));
    if (!giftCard) throw new GiftCardNotFoundError(giftCardId);

    giftCard.cancel();
    await this.giftCardRepo.update(giftCard);

    return GiftCard.toDTO(giftCard);
  }
}
