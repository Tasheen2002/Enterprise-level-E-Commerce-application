import { ICommand } from "@/api/src/shared/application";

export interface CreateGuestCartCommand extends ICommand {
  guestToken: string;
  currency?: string;
  reservationDurationMinutes?: number;
}
