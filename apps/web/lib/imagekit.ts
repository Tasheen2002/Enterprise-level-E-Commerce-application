import { config } from "./config";

interface ImageKitOptions {
  width?: number;
  height?: number;
  v?: string | number;
}

// Bump this version whenever images are re-uploaded to bust CDN/browser cache
const CACHE_BUST_VERSION = "2";

export function imageKitUrl(
  path: string,
  options: ImageKitOptions = {},
): string {
  const cleanPath = path.replace(/^\//, "");
  const transforms: string[] = ["f-auto", "q-auto"];
  if (options.width) transforms.push(`w-${options.width}`);
  if (options.height) transforms.push(`h-${options.height}`);
  
  const version = options.v ?? CACHE_BUST_VERSION;
  const baseUrl = `${config.imageCdn}/${cleanPath}?tr=${transforms.join(",")}`;
  return `${baseUrl}&v=${version}`;
}
