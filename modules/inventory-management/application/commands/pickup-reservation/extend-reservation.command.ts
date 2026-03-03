import { ICommand } from "@/api/src/shared/application";

export interface ExtendReservationCommand extends ICommand {
  reservationId: string;
  additionalMinutes: number;
}
