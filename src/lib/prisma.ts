import { PrismaClient } from "@prisma/client";
import { withOptimize } from "@prisma/extension-optimize";

export const prisma = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL,
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

const optimizeApiKey = process.env.OPTIMIZE_API_KEY;

if (optimizeApiKey) {
  prisma.$extends(withOptimize({ apiKey: optimizeApiKey }));
}

prisma.$on("query", async (e) => {
  console.log(`${e.query} ${e.params}`);
});
