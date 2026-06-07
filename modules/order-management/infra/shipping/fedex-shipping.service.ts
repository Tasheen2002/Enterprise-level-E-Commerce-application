import * as path from "path";
import * as fs from "fs";

export interface FedExConfig {
  apiKey: string;
  secretKey: string;
  accountNumber: string;
  baseUrl: string;
}

export class FedExShippingService {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly accountNumber: string;
  private readonly baseUrl: string;

  constructor(config: FedExConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.accountNumber = config.accountNumber;
    this.baseUrl = config.baseUrl;
  }

  private async getAccessToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", this.apiKey);
    params.append("client_secret", this.secretKey);

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FedEx OAuth authentication failed: ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  async createShipment(
    order: any,
    serviceTier?: string
  ): Promise<{ trackingNumber: string; labelUrl: string }> {
    const accessToken = await this.getAccessToken();

    const shippingAddress = order.address?.shippingAddress;
    if (!shippingAddress) {
      throw new Error("Order has no shipping address");
    }

    // Map service tier
    let serviceType = "FEDEX_GROUND";
    const tier = (serviceTier || "").toUpperCase();
    if (tier.includes("GROUND")) {
      serviceType = "FEDEX_GROUND";
    } else if (tier.includes("2_DAY") || tier.includes("2DAY") || tier.includes("2 DAY")) {
      serviceType = "FEDEX_2_DAY";
    } else if (tier.includes("OVERNIGHT") || tier.includes("EXPRESS")) {
      serviceType = "PRIORITY_OVERNIGHT";
    }

    // Safely map country code
    let countryCode = "US";
    const c = (shippingAddress.country || "").toUpperCase();
    if (c === "US" || c === "USA" || c.includes("UNITED STATES") || c.includes("AMERICA")) {
      countryCode = "US";
    } else {
      countryCode = c.substring(0, 2);
      if (countryCode.length < 2) countryCode = "US";
    }

    // Map state code (must be 2 letters for US)
    let stateCode = (shippingAddress.state || "").toUpperCase();
    if (countryCode === "US") {
      if (stateCode.length > 2) {
        stateCode = stateCode.substring(0, 2);
      }
      if (!stateCode) {
        stateCode = "CA";
      }
    }

    // Clean postal code (must be valid zip code format)
    let postalCode = (shippingAddress.postalCode || "").trim().replace(/\s+/g, "");
    if (countryCode === "US" && postalCode.length > 5) {
      postalCode = postalCode.substring(0, 5);
    }

    const streetLines = [shippingAddress.addressLine1];
    if (shippingAddress.addressLine2) {
      streetLines.push(shippingAddress.addressLine2);
    }

    const payload = {
      labelResponseOptions: "LABEL",
      requestedShipment: {
        shipper: {
          address: {
            streetLines: ["10 Fedex Parkway"],
            city: "Memphis",
            stateOrProvinceCode: "TN",
            postalCode: "38115",
            countryCode: "US",
          },
          contact: {
            personName: "Warehouse Manager",
            phoneNumber: "1234567890",
            companyName: "Slipperze Warehouse",
          },
        },
        recipients: [
          {
            address: {
              streetLines,
              city: shippingAddress.city,
              stateOrProvinceCode: stateCode,
              postalCode,
              countryCode,
            },
            contact: {
              personName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              phoneNumber: shippingAddress.phone || "1234567890",
              email: shippingAddress.email || "",
            },
          },
        ],
        shipDatestamp: new Date().toISOString().split("T")[0],
        serviceType,
        packagingType: "YOUR_PACKAGING",
        pickupType: "USE_SCHEDULED_PICKUP",
        shippingChargesPayment: {
          paymentType: "SENDER",
        },
        labelSpecification: {
          imageType: "PDF",
          labelStockType: "PAPER_85X11_TOP_HALF_LABEL",
        },
        requestedPackageLineItems: [
          {
            weight: {
              units: "LB",
              value: 2,
            },
          },
        ],
      },
      accountNumber: {
        value: this.accountNumber,
      },
    };

    const response = await fetch(`${this.baseUrl}/ship/v1/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("FedEx shipment creation API error:", errorData);
      throw new Error(`FedEx Sandbox API failed: ${response.statusText} - ${errorData}`);
    }

    const responseData = (await response.json()) as any;
    
    const transactionShipment = responseData.output?.transactionShipments?.[0];
    const trackingNumber = transactionShipment?.masterTrackingNumber;
    
    // FedEx API nesting check
    const labelBase64 = 
      transactionShipment?.pieceResponses?.[0]?.packageDocuments?.[0]?.encodedLabel || 
      transactionShipment?.completedShipmentDetail?.document?.encodedLabel ||
      transactionShipment?.completedShipmentDetail?.shipmentDocuments?.[0]?.parts?.[0]?.image;

    if (!trackingNumber) {
      throw new Error("FedEx API succeeded but returned no tracking number");
    }

    if (labelBase64) {
      try {
        const pdfBuffer = Buffer.from(labelBase64, "base64");
        const baseDir = process.cwd().endsWith("api") ? path.resolve(process.cwd(), "..") : process.cwd();
        const dirsToSave = [
          path.join(baseDir, "apps/admin/public/labels"),
          path.join(baseDir, "apps/web/public/labels")
        ];

        for (const dir of dirsToSave) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const filePath = path.join(dir, `${trackingNumber}.pdf`);
          fs.writeFileSync(filePath, pdfBuffer);
        }
      } catch (writeError) {
        console.error("Failed to write label PDF to public folders:", writeError);
      }
    }

    return {
      trackingNumber,
      labelUrl: `/labels/${trackingNumber}.pdf`,
    };
  }
}
