import fs from "fs";
import readline from "readline";

async function main() {
  const fileStream = fs.createReadStream("C:\\Users\\TASHEEN\\.gemini\\antigravity\\brain\\eeaab4d3-6f38-4616-852a-c942f1e64ca7\\.system_generated\\logs\\transcript_full.jsonl");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== Matching Lines for ImageKit ===");
  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (line.toLowerCase().includes("imagekit")) {
      count++;
      console.log(`\n--- Match #${count} ---`);
      // Print the line (limit characters if too long)
      if (line.length > 2000) {
        console.log(line.substring(0, 2000) + "... [TRUNCATED]");
      } else {
        console.log(line);
      }
    }
  }
}

main().catch(console.error);
