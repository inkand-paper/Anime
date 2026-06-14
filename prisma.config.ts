import path from "node:path";
import type { PrismaConfig } from "prisma";

// Prisma 7+ requires connection config in prisma.config.ts
// This replaces the `url` field in datasource block of schema.prisma
export default {
  earlyAccess: true,
  schema: {
    kind: "single",
    filePath: path.join(__dirname, "prisma", "schema.prisma"),
  },
} satisfies PrismaConfig;
