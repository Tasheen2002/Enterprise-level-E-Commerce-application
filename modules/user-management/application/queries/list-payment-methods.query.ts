import { PaymentMethodService } from "../services/payment-method.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface ListPaymentMethodsQuery extends IQuery {
  userId: string;
}

export interface PaymentMethodResult {
  paymentMethodId: string;
  type: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  billingAddressId?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodsListResult {
  userId: string;
  paymentMethods: PaymentMethodResult[];
  totalCount: number;
}

export class ListPaymentMethodsHandler implements IQueryHandler<
  ListPaymentMethodsQuery,
  QueryResult<PaymentMethodsListResult>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    query: ListPaymentMethodsQuery,
  ): Promise<QueryResult<PaymentMethodsListResult>> {
    try {
      // Validate query
      if (!query.userId) {
        return QueryResult.failure<PaymentMethodsListResult>(
          "User ID is required",
        );
      }

      // Get payment methods through service
      const paymentMethods =
        await this.paymentMethodService.getUserPaymentMethods(query.userId);

      const paymentMethodResults: PaymentMethodResult[] = paymentMethods.map(
        (pm) => ({
          paymentMethodId: pm.id,
          type: pm.type,
          brand: pm.brand,
          last4: pm.last4,
          expMonth: pm.expMonth,
          expYear: pm.expYear,
          billingAddressId: pm.billingAddressId,
          isDefault: pm.isDefault,
          createdAt: pm.createdAt,
          updatedAt: pm.updatedAt,
        }),
      );

      const result: PaymentMethodsListResult = {
        userId: query.userId,
        paymentMethods: paymentMethodResults,
        totalCount: paymentMethodResults.length,
      };

      return QueryResult.success<PaymentMethodsListResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<PaymentMethodsListResult>(
          "Failed to retrieve payment methods",
        );
      }

      return QueryResult.failure<PaymentMethodsListResult>(
        "An unexpected error occurred while retrieving payment methods",
      );
    }
  }
}
