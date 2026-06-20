import type { AppConfig } from "./type.ts";

export function logAppConfig(env: AppConfig): void {
  const loggable = {
    PORT: env.port,
    ENV_FOLDER: env.envFolder,
    ENV_TEMPLATE_FOLDER: env.envTemplateFolder,
    ENV_GLOB_PATTERN: env.globPattern,
    OTEL_DENO: env.otelDenoEnabled,
  };

  console.log(`[env] ${JSON.stringify(loggable)}`);
}
