import { config } from "./config";

interface ImageKitOptions {
  width?: number;
  height?: number;
  v?: string | number;
}

export function imageKitUrl(
  path: string,
  options: ImageKitOptions = {},
): string {
  if (!path) return "";
  const cleanPath = path.replace(/^\//, "");
  const transforms: string[] = ["f-auto", "q-auto"];
  if (options.width) transforms.push(`w-${options.width}`);
  if (options.height) transforms.push(`h-${options.height}`);

  const cdnUrl = config.imageCdn || "https://ik.imagekit.io/tasheen";
  const baseUrl = `${cdnUrl}/${cleanPath}?tr=${transforms.join(",")}`;
  return options.v ? `${baseUrl}&v=${options.v}` : baseUrl;
}
