async function testUrl(filename: string) {
  const url = `https://ik.imagekit.io/tasheen/${filename}`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) {
      console.log(`[FOUND] ${filename} - Status: ${res.status}`);
      return true;
    }
  } catch (e) {
    // Ignore
  }
  return false;
}

async function main() {
  const suffixes = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
    "hero", "opened", "perfume", "wallet", "stone", "isolated", "no_bg", "nobg", "png", "default", "base", "solo", "item", "clasp", "close"
  ];
  
  const extensions = [".jpg", ".png", ".jpeg", ".webp"];
  
  console.log("=== Testing More ImageKit CDN URLs (v3) ===");
  for (const suf of suffixes) {
    for (const ext of extensions) {
      const filename = `purple_bag_${suf}${ext}`;
      await testUrl(filename);
    }
  }
}

main().catch(console.error);
