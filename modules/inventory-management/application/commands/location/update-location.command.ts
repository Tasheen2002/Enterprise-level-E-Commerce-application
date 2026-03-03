import { ICommand } from "@/api/src/shared/application";
import { LocationAddress } from "../../../domain/entities/location.entity";

export interface UpdateLocationCommand extends ICommand {
  locationId: string;
  name?: string;
  address?: LocationAddress;
}
