import { parseArgs } from "@std/cli/parse-args";
import type { AppConfig } from "./type.ts";

export function configFromArgs(args: string[]): Partial<AppConfig> {
  const parsed = parseArgs(args, {
    string: [
      "config",
      "port",
      "env-folder",
      "env-template-folder",
      "glob-pattern",
      "template-suffixes",
    ],
    alias: {
      c: "config",
      p: "port",
    },
  });

  return {
    port: parsePort(asString(parsed.port)),
    envFolder: asString(parsed["env-folder"]),
    envTemplateFolder: asString(parsed["env-template-folder"]),
    globPattern: asString(parsed["glob-pattern"]),
    templateSuffixes: parseSuffixes(asString(parsed["template-suffixes"])),
  };
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const lastValue = value[value.length - 1];
    return typeof lastValue === "string" ? lastValue : undefined;
  }

  return undefined;
}

function parsePort(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.error(
      `[env] Invalid --port=${JSON.stringify(raw)}, ignoring CLI value`,
    );
    return undefined;
  }

  return parsed;
}

function parseSuffixes(raw: string | undefined): string[] | undefined {
  if (!raw) {
    return undefined;
  }

  const values = raw.split(",").map((s) => s.trim()).filter((s) =>
    s.length > 0
  );
  return values.length > 0 ? values : undefined;
}
