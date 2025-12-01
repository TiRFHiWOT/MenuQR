// Test signup directly to see the actual error
require("dotenv").config({ path: ".env.local" });

async function testSignup() {
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });

  try {
    console.log("Testing database connection...");
    await prisma.$connect();
    console.log("✅ Connected!");

    console.log("\nTesting user lookup...");
    const existing = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });
    console.log("✅ Query works!");

    console.log("\nTesting user creation...");
    const hashedPassword = await bcrypt.hash("test123", 10);
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("✅ User created! ID:", user.id);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✅ Test user deleted");

    await prisma.$disconnect();
    console.log("\n🎉 All tests passed! Database is working.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testSignup();
