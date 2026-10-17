import fs from "fs";
import readline from "readline";

async function main() {
  const fileStream = fs.createReadStream("C:\\Users\\TASHEEN\\.gemini\\antigravity\\brain\\eeaab4d3-6f38-4616-852a-c942f1e64ca7\\.system_generated\\logs\\transcript_full.jsonl");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== Command Executions in Transcript ===");
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === "run_command") {
            console.log(`\n[Step ${obj.step_index}] At ${obj.created_at}:`);
            console.log(`Command: ${tc.args.CommandLine}`);
          }
        }
      }
      if (obj.type === "RUN_COMMAND") {
        console.log(`Result Status: ${obj.status}`);
        if (obj.content && obj.content.includes("Output:")) {
          // Print first 3 lines of output
          const lines = obj.content.split("\n");
          console.log(`Output (start):`);
          console.log(lines.slice(0, 5).join("\n"));
        }
      }
    } catch (e: any) {
      console.error("Error parsing line:", e.message);
    }
  }
}

main().catch(console.error);
