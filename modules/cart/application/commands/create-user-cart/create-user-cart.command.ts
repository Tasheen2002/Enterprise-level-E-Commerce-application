import { ICommand } from "@/api/src/shared/application";

export interface CreateUserCartCommand extends ICommand {
  userId: string;
  currency?: string;
  reservationDurationMinutes?: number;
}
