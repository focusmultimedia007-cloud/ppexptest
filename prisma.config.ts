import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
});
