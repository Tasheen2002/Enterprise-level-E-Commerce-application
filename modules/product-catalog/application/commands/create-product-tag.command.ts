import { ICommand } from "@/api/src/shared/application";

export interface CreateProductTagCommand extends ICommand {
  tag: string;
  kind?: string;
}
