export const DEFAULT_PORT = 3000;
export const DEFAULT_CONFIG_JSON_PATH = "/app/config.json";
export const DEFAULT_DOCKER_API_VERSION = "v1.43";
export const DEFAULT_DOCKER_SOCKET = "/var/run/docker.sock";
export const DEFAULT_DATA_ROOT = "/data";
export const DEFAULT_ENV_ROOT = DEFAULT_DATA_ROOT;
export const DEFAULT_ENV_GLOB = "**/.env*";
export const DEFAULT_TEMPLATE_SUFFIXES = ".example";

export type AppEnv = {
  port: number;
  envRoot: string;
  envFileGlob: string;
  templateSuffixes: string[];
  otel: {
    denoEnabled: boolean;
    denoConsole: string | null;
    exporterOtlpEndpoint: string | null;
    exporterOtlpProtocol: string | null;
    exporterOtlpHeaders: string | null;
    serviceName: string | null;
    resourceAttributes: string | null;
  };
};

function parseFlag(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" ||
    normalized === "on";
}

function parsePort(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_PORT;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.error(
      `[env] Invalid PORT=${
        JSON.stringify(raw)
      }, using default ${DEFAULT_PORT}`,
    );
    return DEFAULT_PORT;
  }

  return parsed;
}

function nullable(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function readEnv(): AppEnv {
  return {
    port: parsePort(Deno.env.get("PORT")),
    envRoot: Deno.env.get("ENV_ROOT") || DEFAULT_ENV_ROOT,
    envFileGlob: Deno.env.get("ENV_GLOB") || DEFAULT_ENV_GLOB,
    templateSuffixes:
      (Deno.env.get("TEMPLATE_SUFFIX") || DEFAULT_TEMPLATE_SUFFIXES)
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    otel: {
      denoEnabled: parseFlag(Deno.env.get("OTEL_DENO")),
      denoConsole: nullable(Deno.env.get("OTEL_DENO_CONSOLE")),
      exporterOtlpEndpoint: nullable(
        Deno.env.get("OTEL_EXPORTER_OTLP_ENDPOINT"),
      ),
      exporterOtlpProtocol: nullable(
        Deno.env.get("OTEL_EXPORTER_OTLP_PROTOCOL"),
      ),
      exporterOtlpHeaders: nullable(Deno.env.get("OTEL_EXPORTER_OTLP_HEADERS")),
      serviceName: nullable(Deno.env.get("OTEL_SERVICE_NAME")),
      resourceAttributes: nullable(Deno.env.get("OTEL_RESOURCE_ATTRIBUTES")),
    },
  };
}

export const appEnv = readEnv();

export function logEnvConfiguration(env: AppEnv): void {
  const loggable = {
    PORT: env.port,
    ENV_ROOT: env.envRoot,
    ENV_GLOB: env.envFileGlob,
    TEMPLATE_SUFFIX: env.templateSuffixes.join(","),
    OTEL_DENO: env.otel.denoEnabled,
    OTEL_DENO_CONSOLE: env.otel.denoConsole,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.otel.exporterOtlpEndpoint,
    OTEL_EXPORTER_OTLP_PROTOCOL: env.otel.exporterOtlpProtocol,
    OTEL_EXPORTER_OTLP_HEADERS: env.otel.exporterOtlpHeaders ? "<set>" : null,
    OTEL_SERVICE_NAME: env.otel.serviceName,
    OTEL_RESOURCE_ATTRIBUTES: env.otel.resourceAttributes,
  };

  console.log(`[env] ${JSON.stringify(loggable)}`);
}
