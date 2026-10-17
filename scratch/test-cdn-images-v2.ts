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
    "open", "inside", "interior", "studio", "pedestal", "angle", "flatlay", "layflat", 
    "packshot", "main", "front", "back", "detail", "clasp", "close", "closeup", 
    "lifestyle", "street", "paris", "model", "woman", "bag", "product"
  ];
  
  const extensions = [".jpg", ".png", ".jpeg", ".webp"];
  
  console.log("=== Testing More ImageKit CDN URLs ===");
  for (const suf of suffixes) {
    for (const ext of extensions) {
      const filename = `purple_bag_${suf}${ext}`;
      await testUrl(filename);
    }
  }
}

main().catch(console.error);
