export interface UserAgentInfo {
  browser: string;
  os: string;
  deviceType: string;
}

export function parseUserAgent(ua: string | undefined | null): UserAgentInfo {
  if (!ua) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "desktop",
    };
  }

  const browser = getBrowser(ua);
  const os = getOS(ua);
  const deviceType = getDeviceType(ua);

  return { browser, os, deviceType };
}

function getBrowser(ua: string): string {
  if (ua.includes("Brave")) return "Brave";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("SamsungBrowser")) return "Samsung Browser";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  if (ua.includes("Trident")) return "Internet Explorer";
  if (ua.includes("Edg") || ua.includes("Edge")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown Browser";
}

function getOS(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) return "iOS";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown OS";
}

function getDeviceType(ua: string): string {
  if (ua.includes("Mobi")) return "mobile";
  if (ua.includes("Tablet") || ua.includes("iPad")) return "tablet";
  return "desktop";
}
