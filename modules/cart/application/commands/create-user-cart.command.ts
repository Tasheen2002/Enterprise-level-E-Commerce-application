import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface CreateUserCartCommand extends ICommand {
  userId: string;
  currency?: string;
  reservationDurationMinutes?: number;
}

export class CreateUserCartHandler
  implements ICommandHandler<CreateUserCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    command: CreateUserCartCommand,
  ): Promise<CommandResult<CartDto>> {
    try {
      const errors: string[] = [];

      if (!command.userId || command.userId.trim().length === 0) {
        errors.push("userId: User ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<CartDto>("Validation failed", errors);
      }

      const result = await this.cartManagementService.createUserCart({
        userId: command.userId,
        currency: command.currency || "USD",
        reservationDurationMinutes: command.reservationDurationMinutes,
      });

      return CommandResult.success<CartDto>(result);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to create user cart",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
