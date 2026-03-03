import { ICommand } from "@/api/src/shared/application";
import { LocationAddress } from "../../../domain/entities/location.entity";

export interface CreateLocationCommand extends ICommand {
  type: string;
  name: string;
  address?: LocationAddress;
}
