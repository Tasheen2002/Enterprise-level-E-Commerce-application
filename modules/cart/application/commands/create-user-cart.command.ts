import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface CreateUserCartCommand extends ICommand {
  userId: string;
  currency?: string;
  reservationDurationMinutes?: number;
}

export class CreateUserCartHandler implements ICommandHandler<CreateUserCartCommand, CommandResult<CartDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: CreateUserCartCommand): Promise<CommandResult<CartDto>> {
    const result = await this.cartManagementService.createUserCart({
      userId: command.userId,
      currency: command.currency || "USD",
      reservationDurationMinutes: command.reservationDurationMinutes,
    });
    return CommandResult.success<CartDto>(result);
  }
}
