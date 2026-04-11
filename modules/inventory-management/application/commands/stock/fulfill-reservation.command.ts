import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockDTO } from "../../../domain/entities/stock.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface FulfillReservationInput extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
}

export class FulfillReservationHandler implements ICommandHandler<
  FulfillReservationInput,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(input: FulfillReservationInput): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.fulfillReservation(
      input.variantId,
      input.locationId,
      input.quantity,
    );
    return CommandResult.success(stock);
  }
}
