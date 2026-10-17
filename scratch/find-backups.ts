import fs from "fs";
import path from "path";

function findFiles(dir: string, extensions: string[], results: string[] = []) {
  if (dir.includes("node_modules") || dir.includes(".git") || dir.includes(".turbo")) {
    return results;
  }
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findFiles(fullPath, extensions, results);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    // Ignore permission errors
  }
  return results;
}

const sqlAndJsonFiles = findFiles(".", [".sql", ".json"]);
console.log("=== Found JSON and SQL files in workspace ===");
sqlAndJsonFiles.forEach((file) => {
  console.log(`- ${file}`);
});
