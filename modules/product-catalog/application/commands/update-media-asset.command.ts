import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";

export interface UpdateMediaAssetCommand extends ICommand {
  id: string;
  mime?: string;
  width?: number;
  height?: number;
  bytes?: number;
  altText?: string;
  focalX?: number;
  focalY?: number;
  renditions?: Record<string, unknown>;
}

export class UpdateMediaAssetHandler implements ICommandHandler<UpdateMediaAssetCommand, CommandResult<MediaAssetDTO>> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(command: UpdateMediaAssetCommand): Promise<CommandResult<MediaAssetDTO>> {
    const { id, ...updates } = command;
    const dto = await this.mediaManagementService.updateAsset(id, updates);
    return CommandResult.success(dto);
  }
}
