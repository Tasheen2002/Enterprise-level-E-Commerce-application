import { ICommand } from "@/api/src/shared/application";

export interface CancelPickupReservationCommand extends ICommand {
  reservationId: string;
}
