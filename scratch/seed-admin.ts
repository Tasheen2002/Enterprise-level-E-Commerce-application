import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce"
    }
  }
});

async function main() {
  const email = "tasheenadmin@gmail.com";
  const password = "JackCM@3003";

  console.log(`=== Seeding Admin User: ${email} ===`);

  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`User ${email} already exists. Deleting first to ensure fresh state...`);
      await prisma.user.delete({
        where: { email }
      });
    }

    // Hash the password with 12 rounds
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.active,
        emailVerified: true,
        isGuest: false
      }
    });

    console.log("Admin user created successfully!");
    console.log("Details:", {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      emailVerified: newUser.emailVerified
    });

  } catch (error: any) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
