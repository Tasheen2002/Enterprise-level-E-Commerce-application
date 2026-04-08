// Export route registration function
export { registerLoyaltyRoutes } from './infra/http/routes';

// Export types and entities for use in other modules
export { LoyaltyService } from './application/services/loyalty.service';
export { TransactionReason } from './domain/entities/loyalty-transaction.entity';
export type { LoyaltyAccountData, LoyaltyTransactionData } from './application/services/loyalty.service';
