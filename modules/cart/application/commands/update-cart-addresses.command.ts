import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface UpdateCartAddressesCommand extends ICommand {
  readonly cartId: string;
  readonly shippingFirstName?: string;
  readonly shippingLastName?: string;
  readonly shippingAddress1?: string;
  readonly shippingAddress2?: string;
  readonly shippingCity?: string;
  readonly shippingProvince?: string;
  readonly shippingPostalCode?: string;
  readonly shippingCountryCode?: string;
  readonly shippingPhone?: string;
  readonly billingFirstName?: string;
  readonly billingLastName?: string;
  readonly billingAddress1?: string;
  readonly billingAddress2?: string;
  readonly billingCity?: string;
  readonly billingProvince?: string;
  readonly billingPostalCode?: string;
  readonly billingCountryCode?: string;
  readonly billingPhone?: string;
  readonly sameAddressForBilling?: boolean;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class UpdateCartAddressesHandler implements ICommandHandler<
  UpdateCartAddressesCommand,
  CommandResult<CartDto>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    command: UpdateCartAddressesCommand,
  ): Promise<CommandResult<CartDto>> {
    await this.cartManagementService.updateCartAddresses(
      command.cartId,
      {
        shippingFirstName: command.shippingFirstName,
        shippingLastName: command.shippingLastName,
        shippingAddress1: command.shippingAddress1,
        shippingAddress2: command.shippingAddress2,
        shippingCity: command.shippingCity,
        shippingProvince: command.shippingProvince,
        shippingPostalCode: command.shippingPostalCode,
        shippingCountryCode: command.shippingCountryCode,
        shippingPhone: command.shippingPhone,
        billingFirstName: command.billingFirstName,
        billingLastName: command.billingLastName,
        billingAddress1: command.billingAddress1,
        billingAddress2: command.billingAddress2,
        billingCity: command.billingCity,
        billingProvince: command.billingProvince,
        billingPostalCode: command.billingPostalCode,
        billingCountryCode: command.billingCountryCode,
        billingPhone: command.billingPhone,
        sameAddressForBilling: command.sameAddressForBilling,
      },
      command.userId,
      command.guestToken,
    );
    const cart = await this.cartManagementService.getCart(
      command.cartId,
      command.userId,
      command.guestToken,
    );
    return CommandResult.success<CartDto>(cart!);
  }
}
