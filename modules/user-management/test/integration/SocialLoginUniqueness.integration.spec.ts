import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

// Provider user ids are issued independently by each identity provider.
const prisma = new PrismaClient();
let firstUser: string;
let secondUser: string;

beforeEach(async () => {
  const user = async () =>
    (await prisma.user.create({ data: { email: `social-${randomUUID()}@example.test` } })).id;
  firstUser = await user();
  secondUser = await user();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("social login uniqueness", () => {
  it("allows the same provider user id from different providers", async () => {
    await prisma.socialLogin.create({
      data: { userId: firstUser, provider: "google", providerUserId: "1234567890" },
    });
    await expect(
      prisma.socialLogin.create({
        data: { userId: secondUser, provider: "facebook", providerUserId: "1234567890" },
      }),
    ).resolves.toBeDefined();
  });

  it("still rejects a second link of one provider identity", async () => {
    await prisma.socialLogin.create({
      data: { userId: firstUser, provider: "google", providerUserId: "1234567890" },
    });
    await expect(
      prisma.socialLogin.create({
        data: { userId: secondUser, provider: "google", providerUserId: "1234567890" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
