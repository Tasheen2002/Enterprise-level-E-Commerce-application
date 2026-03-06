import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  PaymentService,
  PaymentTransactionDto,
} from "../../services/payment.service";
import { GetPaymentTransactionsQuery } from "./get-payment-transactions.query";

export class GetPaymentTransactionsHandler implements IQueryHandler<
  GetPaymentTransactionsQuery,
  QueryResult<PaymentTransactionDto[]>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    query: GetPaymentTransactionsQuery,
  ): Promise<QueryResult<PaymentTransactionDto[]>> {
    try {
      const txns = await this.paymentService.getPaymentTransactions(
        query.intentId,
        query.userId,
      );
      return QueryResult.success<PaymentTransactionDto[]>(txns);
    } catch (error) {
      return QueryResult.failure<PaymentTransactionDto[]>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving payment transactions",
      );
    }
  }
}
