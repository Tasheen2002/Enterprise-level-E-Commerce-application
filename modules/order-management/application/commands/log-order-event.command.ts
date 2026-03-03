import { ICommand } from "@/api/src/shared/application";

export interface LogOrderEventCommand extends ICommand {
  orderId: string;
  eventType: string;
  payload?: Record<string, any>;
}
