import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { PaymentMethodService } from "../../services/payment-method.service";
import { ListPaymentMethodsQuery, PaymentMethodsListResult } from "./list-payment-methods.query";

export class ListPaymentMethodsHandler implements IQueryHandler<ListPaymentMethodsQuery, QueryResult<PaymentMethodsListResult>> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(query: ListPaymentMethodsQuery): Promise<QueryResult<PaymentMethodsListResult>> {
    try {
      const paymentMethods = await this.paymentMethodService.getUserPaymentMethods(query.userId);
      return QueryResult.success<PaymentMethodsListResult>({
        userId: query.userId,
        paymentMethods: paymentMethods.map((pm) => ({
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
        })),
        totalCount: paymentMethods.length,
      });
    } catch (error) {
      return QueryResult.failure<PaymentMethodsListResult>(
        error instanceof Error ? error.message : "Failed to retrieve payment methods",
      );
    }
  }
}
