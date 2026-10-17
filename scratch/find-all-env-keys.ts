import fs from "fs";
import path from "path";

function findEnvFiles(dir: string, results: string[] = []) {
  if (dir.includes("node_modules") || dir.includes(".git") || dir.includes(".turbo") || dir.includes(".next")) {
    return results;
  }
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findEnvFiles(fullPath, results);
      } else if (file.startsWith(".env")) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore
  }
  return results;
}

const envFiles = findEnvFiles(".");
console.log("=== Found .env files ===");
envFiles.forEach((file) => {
  console.log(`\nFile: ${file}`);
  try {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
      if (match) {
        console.log(`- ${match[1]}`);
      }
    }
  } catch (err: any) {
    console.log(`Error reading: ${err.message}`);
  }
});
