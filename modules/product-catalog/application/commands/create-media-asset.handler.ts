import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MediaAsset } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";
import { CreateMediaAssetCommand } from "./create-media-asset.command";

export class CreateMediaAssetHandler implements ICommandHandler<
  CreateMediaAssetCommand,
  CommandResult<MediaAsset>
> {
  constructor(
    private readonly mediaManagementService: MediaManagementService,
  ) {}

  async handle(
    command: CreateMediaAssetCommand,
  ): Promise<CommandResult<MediaAsset>> {
    try {
      const asset = await this.mediaManagementService.createAsset({
        storageKey: command.storageKey,
        mime: command.mime,
        width: command.width,
        height: command.height,
        bytes: command.bytes,
        altText: command.altText,
        focalX: command.focalX,
        focalY: command.focalY,
        renditions: command.renditions || {},
      });
      return CommandResult.success<MediaAsset>(asset);
    } catch (error) {
      return CommandResult.failure<MediaAsset>(
        error instanceof Error ? error.message : "Media asset creation failed",
      );
    }
  }
}
