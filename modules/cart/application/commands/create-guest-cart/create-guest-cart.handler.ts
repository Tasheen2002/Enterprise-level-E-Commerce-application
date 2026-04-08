import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../../services/cart-management.service";
import { CreateGuestCartCommand } from "./create-guest-cart.command";

export class CreateGuestCartHandler
  implements ICommandHandler<CreateGuestCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: CreateGuestCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const result = await this.cartManagementService.createGuestCart({
        guestToken: command.guestToken,
        currency: command.currency || "USD",
        reservationDurationMinutes: command.reservationDurationMinutes,
      });
      return CommandResult.success<CartDto>(result);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to create guest cart",
      );
    }
  }
}
