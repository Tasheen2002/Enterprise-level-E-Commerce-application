import { MediaManagementService } from "../services/media-management.service";
import { MediaAsset } from "../../domain/entities/media-asset.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface CreateMediaAssetCommand extends ICommand {
  storageKey: string;
  mime: string;
  width?: number;
  height?: number;
  bytes?: number;
  altText?: string;
  focalX?: number;
  focalY?: number;
  renditions?: Record<string, any>;
  version?: number;
}

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
      if (!command.storageKey) {
        return CommandResult.failure<MediaAsset>("Storage key is required", [
          "storageKey",
        ]);
      }

      if (!command.mime) {
        return CommandResult.failure<MediaAsset>("MIME type is required", [
          "mime",
        ]);
      }

      const assetData = {
        storageKey: command.storageKey,
        mime: command.mime,
        width: command.width,
        height: command.height,
        bytes: command.bytes,
        altText: command.altText,
        focalX: command.focalX,
        focalY: command.focalY,
        renditions: command.renditions || {},
        version: command.version || 1,
      };

      const asset = await this.mediaManagementService.createAsset(assetData);
      return CommandResult.success<MediaAsset>(asset);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<MediaAsset>(
          "Media asset creation failed",
          [error.message],
        );
      }

      return CommandResult.failure<MediaAsset>(
        "An unexpected error occurred during media asset creation",
      );
    }
  }
}
