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
    "",
    "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "front", "back", "inside", "interior", "clasp", "close", "street", "lifestyle", "studio", "pedestal", "detail", "side"
  ];
  
  const extensions = [".jpg", ".png", ".jpeg", ".webp"];
  
  console.log("=== Testing ImageKit CDN URLs ===");
  
  // Test basic known ones first
  await testUrl("hero-women.png");
  await testUrl("men-hero.png");
  await testUrl("cat-heeled-sandals.png");
  await testUrl("cat-leather-goods.png");
  await testUrl("cat-flat-sandals.png");
  await testUrl("cat-ballet-flats.png");
  await testUrl("cat-men-leather-goods.png");
  await testUrl("cat-men-loafers.png");
  await testUrl("cat-men-boat-shoes.png");
  await testUrl("editorial-women.png");
  await testUrl("editorial-men.png");

  // Try combinations for purple_bag
  for (const suf of suffixes) {
    for (const ext of extensions) {
      const filename = suf ? `purple_bag_${suf}${ext}` : `purple_bag${ext}`;
      await testUrl(filename);
    }
  }
}

main().catch(console.error);
