import type { AppConfig } from "./type.ts";

export const DEFAULT_CONFIG: AppConfig = {
  port: 3000,
  envFolder: "/data/env",
  envTemplateFolder: "/data/env-template",
  globPattern: "**/.env*",
  templateSuffixes: [".example", ".template", ".tmpl"],
  otelDenoEnabled: false,
};
