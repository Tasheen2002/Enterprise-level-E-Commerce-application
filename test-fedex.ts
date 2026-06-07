import { FedExShippingService } from "./modules/order-management/infra/shipping/fedex-shipping.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env
dotenv.config();

async function runTest() {
  console.log("Starting FedEx Sandbox API test...");

  const apiKey = process.env.FEDEX_API_KEY || "l747befc81f4f94ab285631a2148503751";
  const secretKey = process.env.FEDEX_SECRET_KEY || "512d30a91889472fb4d3335c06b96f03";
  const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER || "740561073";
  const baseUrl = process.env.FEDEX_URL || "https://apis-sandbox.fedex.com";

  console.log(`Using API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`Using Account Number: ${accountNumber}`);
  console.log(`Using Base URL: ${baseUrl}`);

  const fedexService = new FedExShippingService({
    apiKey,
    secretKey,
    accountNumber,
    baseUrl,
  });

  // Mock order structure matching FedExShippingService requirements
  const mockOrder = {
    address: {
      shippingAddress: {
        firstName: "John",
        lastName: "Doe",
        addressLine1: "1600 Amphitheatre Pkwy",
        city: "Mountain View",
        state: "CA",
        postalCode: "94043",
        country: "US",
        phone: "1234567890",
        email: "john.doe@example.com",
      },
    },
  };

  try {
    const result = await fedexService.createShipment(mockOrder, "FedEx Ground");
    console.log("\n✅ FedEx Sandbox API Call Succeeded!");
    console.log(`Generated Tracking Number: ${result.trackingNumber}`);
    console.log(`Label URL: ${result.labelUrl}`);

    // Check if the file was written
    const baseDir = process.cwd();
    const adminLabelPath = path.join(baseDir, "apps/admin/public", result.labelUrl);
    const webLabelPath = path.join(baseDir, "apps/web/public", result.labelUrl);

    console.log("\nChecking generated PDF files on disk:");
    if (fs.existsSync(adminLabelPath)) {
      console.log(`   - Saved to Admin: ${adminLabelPath} (${fs.statSync(adminLabelPath).size} bytes)`);
    } else {
      console.log(`   - ❌ Label not found in Admin: ${adminLabelPath}`);
    }

    if (fs.existsSync(webLabelPath)) {
      console.log(`   - Saved to Web: ${webLabelPath} (${fs.statSync(webLabelPath).size} bytes)`);
    } else {
      console.log(`   - ❌ Label not found in Web: ${webLabelPath}`);
    }
  } catch (error: any) {
    console.error("\n❌ FedEx Sandbox API Call Failed:");
    console.error(error.message);
  }
}

runTest();
