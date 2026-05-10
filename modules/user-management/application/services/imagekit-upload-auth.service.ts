import { createHmac, randomBytes } from "crypto";

/**
 * Signed-upload-token issuer for ImageKit.
 *
 * The browser cannot embed `IMAGEKIT_PRIVATE_KEY` (it would leak), so we
 * mint a short-lived HMAC token here and hand the browser ONLY the
 * inputs required for ImageKit's upload API:
 *
 *   POST https://upload.imagekit.io/api/v1/files/upload
 *     - file
 *     - fileName
 *     - publicKey
 *     - token       (random per upload)
 *     - expire      (unix seconds, ≤ now + 1h per ImageKit spec)
 *     - signature   (HMAC-SHA1(privateKey, token + expire))
 *     - folder      (optional, where to store the file)
 *
 * ImageKit verifies the signature server-side, so a leaked token can't be
 * reused outside its expiry window. The token is single-use enforced by
 * the ImageKit upload API.
 *
 * 5-minute expiry is generous for a user picking a file + dragging upload.
 */
export interface ImageKitUploadAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  folder: string;
  uploadEndpoint: string;
}

export interface ImageKitConfig {
  publicKey: string;
  privateKey: string;
}

const UPLOAD_ENDPOINT = "https://upload.imagekit.io/api/v1/files/upload";
const TOKEN_TTL_SECONDS = 5 * 60;

export class ImageKitUploadAuthService {
  constructor(private readonly config: ImageKitConfig) {
    if (!config.publicKey || !config.privateKey) {
      throw new Error(
        "ImageKitUploadAuthService requires both publicKey and privateKey",
      );
    }
  }

  /**
   * Mint a signed upload token. `subjectId` is used to scope uploads
   * into a per-user folder so different users' avatars don't collide.
   */
  issue(params: { subjectId: string; folder?: string }): ImageKitUploadAuth {
    const token = randomBytes(16).toString("hex");
    const expire = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const signature = createHmac("sha1", this.config.privateKey)
      .update(token + expire)
      .digest("hex");

    return {
      token,
      expire,
      signature,
      publicKey: this.config.publicKey,
      folder: params.folder ?? `/avatars/${params.subjectId}`,
      uploadEndpoint: UPLOAD_ENDPOINT,
    };
  }
}
