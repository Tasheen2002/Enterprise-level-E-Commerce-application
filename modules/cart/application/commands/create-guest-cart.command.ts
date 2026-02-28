import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface CreateGuestCartCommand extends ICommand {
  guestToken: string;
  currency?: string;
  reservationDurationMinutes?: number;
}

export class CreateGuestCartHandler
  implements ICommandHandler<CreateGuestCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    command: CreateGuestCartCommand,
  ): Promise<CommandResult<CartDto>> {
    try {
      const errors: string[] = [];

      if (!command.guestToken || command.guestToken.trim().length === 0) {
        errors.push("guestToken: Guest token is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<CartDto>("Validation failed", errors);
      }

      const result = await this.cartManagementService.createGuestCart({
        guestToken: command.guestToken,
        currency: command.currency || "USD",
        reservationDurationMinutes: command.reservationDurationMinutes,
      });

      return CommandResult.success<CartDto>(result);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to create guest cart",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
