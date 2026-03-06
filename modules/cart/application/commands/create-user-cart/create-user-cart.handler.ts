import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../../services/cart-management.service";
import { CreateUserCartCommand } from "./create-user-cart.command";

export class CreateUserCartHandler
  implements ICommandHandler<CreateUserCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: CreateUserCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const result = await this.cartManagementService.createUserCart({
        userId: command.userId,
        currency: command.currency || "USD",
        reservationDurationMinutes: command.reservationDurationMinutes,
      });
      return CommandResult.success<CartDto>(result);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to create user cart",
      );
    }
  }
}
