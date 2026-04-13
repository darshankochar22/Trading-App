import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@stellar.app";
const DEMO_NAME = "Demo Trader";

export async function ensureDemoUser() {
  // Deprecated: kept only for local seeding during earlier iterations.
  // Real auth uses /api/auth/signup + /api/auth/login sessions.
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      passwordHash: "MIGRATED_NO_PASSWORD",
      profile: { create: { plan: "Paper Trading" } },
      account: { create: { cash: 1_000_000, startingCash: 1_000_000 } },
    },
    include: { profile: true, account: true },
  });
  return user;
}

