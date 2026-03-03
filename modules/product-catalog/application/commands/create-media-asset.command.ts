import { ICommand } from "@/api/src/shared/application";

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
