import fs from "fs";
import path from "path";

function searchSqlFiles(dir: string, results: string[] = []) {
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchSqlFiles(fullPath, results);
      } else if (file.endsWith(".sql")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (content.toLowerCase().includes("insert into")) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  return results;
}

const matchingFiles = searchSqlFiles("./prisma");
console.log("=== SQL files containing INSERT statements ===");
matchingFiles.forEach((file) => {
  console.log(`- ${file}`);
});
