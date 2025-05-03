import { PrismaClient } from "../generated/client";

export const prisma = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL,
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    console.log(`${e.query} ${e.params}`);
  });
}
