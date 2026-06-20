import type { AppConfig } from "./type.ts";

export function configFromEnv(): Partial<AppConfig> {
  return {
    port: parsePort(Deno.env.get("PORT")),
    envFolder: Deno.env.get("ENV_FOLDER"),
    envTemplateFolder: Deno.env.get("ENV_TEMPLATE_FOLDER"),
    globPattern: Deno.env.get("ENV_GLOB_PATTERN"),
    templateSuffixes: parseStringArray(Deno.env.get("TEMPLATE_SUFFIXES")),
    otelDenoEnabled: parseFlag(Deno.env.get("OTEL_DENO")),
  };
}

function parseFlag(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" ||
    normalized === "on";
}

function parsePort(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.error(`[env] Invalid PORT=${JSON.stringify(raw)}`);
    return undefined;
  }

  return parsed;
}

function parseStringArray(
  raw: string | undefined,
): string[] | undefined {
  if (!raw) {
    return undefined;
  }
  const values = raw.split(",").map((s) => s.trim()).filter((s) =>
    s.length > 0
  );
  return values.length > 0 ? values : undefined;
}
