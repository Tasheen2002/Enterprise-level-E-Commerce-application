import fs from "fs";
import path from "path";

const artifactsDir = "C:\\Users\\TASHEEN\\.gemini\\antigravity\\brain\\eeaab4d3-6f38-4616-852a-c942f1e64ca7";

function searchArtifacts() {
  console.log("=== Searching Artifacts for Product/Image names ===");
  try {
    const files = fs.readdirSync(artifactsDir);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = path.join(artifactsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          const lower = line.toLowerCase();
          if (lower.includes(".png") || lower.includes(".jpg") || lower.includes("bag") || lower.includes("heel") || lower.includes("imagekit")) {
            console.log(`[${file}:${idx + 1}] ${line.trim()}`);
          }
        });
      }
    }
  } catch (e: any) {
    console.error("Error reading artifacts:", e.message);
  }
}

searchArtifacts();
