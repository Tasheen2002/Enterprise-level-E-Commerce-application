import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";

export interface CreateMediaAssetCommand extends ICommand {
  readonly storageKey: string;
  readonly mime: string;
  readonly width?: number;
  readonly height?: number;
  readonly bytes?: number;
  readonly altText?: string;
  readonly focalX?: number;
  readonly focalY?: number;
  readonly renditions?: Record<string, unknown>;
}

export class CreateMediaAssetHandler implements ICommandHandler<CreateMediaAssetCommand, CommandResult<MediaAssetDTO>> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(command: CreateMediaAssetCommand): Promise<CommandResult<MediaAssetDTO>> {
    const dto = await this.mediaManagementService.createAsset(command);
    return CommandResult.success(dto);
  }
}
