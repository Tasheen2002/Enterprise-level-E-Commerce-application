import fs from "fs";
import path from "path";

function findImageFiles(dir: string, extensions: string[], results: string[] = []) {
  if (dir.includes("node_modules") || dir.includes(".git") || dir.includes(".turbo") || dir.includes(".next")) {
    return results;
  }
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findImageFiles(fullPath, extensions, results);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return results;
}

const images = findImageFiles(".", [".png", ".jpg", ".jpeg", ".webp", ".svg"]);
console.log("=== Found Image Files in Workspace ===");
images.forEach((img) => {
  console.log(`- ${img}`);
});
