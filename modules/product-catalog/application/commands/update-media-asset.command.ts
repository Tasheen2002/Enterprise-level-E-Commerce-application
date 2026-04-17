import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";

export interface UpdateMediaAssetCommand extends ICommand {
  readonly id: string;
  readonly mime?: string;
  readonly width?: number;
  readonly height?: number;
  readonly bytes?: number;
  readonly altText?: string;
  readonly focalX?: number;
  readonly focalY?: number;
  readonly renditions?: Record<string, unknown>;
}

export class UpdateMediaAssetHandler implements ICommandHandler<UpdateMediaAssetCommand, CommandResult<MediaAssetDTO>> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(command: UpdateMediaAssetCommand): Promise<CommandResult<MediaAssetDTO>> {
    const { id, ...updates } = command;
    const dto = await this.mediaManagementService.updateAsset(id, updates);
    return CommandResult.success(dto);
  }
}
