import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService } from "../services/cart-management.service";

export interface CleanupExpiredCartsCommand extends ICommand {}

export class CleanupExpiredCartsHandler implements ICommandHandler<CleanupExpiredCartsCommand, CommandResult<{ deletedCount: number }>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(_command: CleanupExpiredCartsCommand): Promise<CommandResult<{ deletedCount: number }>> {
    const deletedCount = await this.cartManagementService.cleanupExpiredCarts();
    return CommandResult.success({ deletedCount });
  }
}
