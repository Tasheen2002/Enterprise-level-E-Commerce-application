import fs from "fs";

try {
  const envContent = fs.readFileSync(".env", "utf-8");
  const lines = envContent.split("\n");
  console.log("=== Keys found in .env ===");
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      console.log(`- ${match[1]}`);
    }
  }
} catch (e: any) {
  console.error("Error reading .env:", e.message);
}
