import fs from "fs";
import path from "path";

async function main() {
  console.log("Reading environment variables...");
  let publicKey = "";
  let privateKey = "";
  let urlEndpoint = "";

  try {
    const envContent = fs.readFileSync(".env", "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        if (key === "IMAGEKIT_PUBLIC_KEY" || key === "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY") {
          publicKey = val.trim();
        }
        if (key === "IMAGEKIT_PRIVATE_KEY") {
          privateKey = val.trim();
        }
        if (key === "IMAGEKIT_URL_ENDPOINT" || key === "NEXT_PUBLIC_IMAGE_CDN") {
          urlEndpoint = val.trim();
        }
      }
    }
  } catch (e: any) {
    console.error("Could not read .env file:", e.message);
  }

  if (!privateKey) {
    console.log("No IMAGEKIT_PRIVATE_KEY found in .env.");
    return;
  }

  console.log(`Connecting to ImageKit API using private key...`);
  
  // Call ImageKit list files API: GET https://api.imagekit.io/v1/files
  // Authentication is Basic Auth: base64(private_key + ":")
  const authHeader = "Basic " + Buffer.from(privateKey + ":").toString("base64");

  try {
    const response = await fetch("https://api.imagekit.io/v1/files?limit=100", {
      headers: {
        Authorization: authHeader
      }
    });

    if (!response.ok) {
      throw new Error(`ImageKit API returned status ${response.status}: ${await response.text()}`);
    }

    const files = await response.json() as any[];
    console.log(`\n=== Found ${files.length} Files in ImageKit Library ===`);
    files.forEach((file) => {
      console.log(`- Name: ${file.name}`);
      console.log(`  Path: ${file.filePath}`);
      console.log(`  URL: ${file.url}`);
      console.log(`  Created: ${file.createdAt}`);
      console.log("-----------------------------------------");
    });
  } catch (err: any) {
    console.error("Error fetching files from ImageKit:", err.message);
  }
}

main().catch(console.error);
