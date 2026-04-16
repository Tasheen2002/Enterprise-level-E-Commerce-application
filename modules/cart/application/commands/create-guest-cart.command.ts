import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";
import { DEFAULT_CURRENCY } from "../../domain/constants/cart.constants";

export interface CreateGuestCartCommand extends ICommand {
  readonly guestToken: string;
  readonly currency?: string;
  readonly reservationDurationMinutes?: number;
}

export class CreateGuestCartHandler implements ICommandHandler<
  CreateGuestCartCommand,
  CommandResult<CartDto>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    command: CreateGuestCartCommand,
  ): Promise<CommandResult<CartDto>> {
    const result = await this.cartManagementService.createGuestCart({
      guestToken: command.guestToken,
      currency: command.currency ?? DEFAULT_CURRENCY,
      reservationDurationMinutes: command.reservationDurationMinutes,
    });
    return CommandResult.success<CartDto>(result);
  }
}
