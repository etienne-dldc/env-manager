import { sValidator } from "@hono/standard-validator";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import * as v from "@valibot/valibot";
import { type Context, Hono } from "hono";
import { serveStatic } from "hono/deno";
import { routePath } from "hono/route";
import { VariableValueDisplay } from "./components/EnvVariableItem/VariableValueDisplay.tsx";
import { VariableValueEdit } from "./components/EnvVariableItem/VariableValueEdit.tsx";
import denoJson from "./deno.json" with { type: "json" };
import {
  createBackend,
  normalizeBackendFileName,
} from "./logic/backend/backend.ts";
import { appEnv, logEnvConfiguration } from "./logic/env.ts";
import { redirectWithMessage } from "./logic/redirectWithMessage.ts";
import { AppsPage } from "./views/AppsPage.tsx";
import { EnvFileDetailsPage } from "./views/EnvFileDetailsPage.tsx";
import { ErrorPage } from "./views/ErrorPage.tsx";
import { NotFoundPage } from "./views/NotFoundPage.tsx";

console.log(`Starting Env Manager v${denoJson.version}`);
logEnvConfiguration(appEnv);
console.log(
  `OpenTelemetry ${appEnv.otel.denoEnabled ? "enabled" : "disabled"}`,
);

const backend = createBackend({
  envFilesFolder: appEnv.envFolder,
  envTemplatesFolder: appEnv.envTemplateFolder,
});

function getFlash(c: Context) {
  return {
    ok: c.req.query("ok") ?? null,
    error: c.req.query("error") ?? null,
  };
}

const app = new Hono();

app.use("*", async (c, next) => {
  try {
    await next();
  } catch (error) {
    throw error;
  } finally {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const route = routePath(c);
      activeSpan.setAttribute("http.route", route);
      activeSpan.updateName(`${c.req.method} ${route}`);

      if (c.error) {
        activeSpan.recordException(c.error);
        activeSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: c.error.message,
        });
      }
    }
  }
});

app.use(
  "/public/*",
  serveStatic({ root: "./" }),
);

app.use("*", async (c, next) => {
  await next();

  if (!c.req.path.startsWith("/public/")) {
    c.header("cache-control", "no-store");
  }
});

app.onError((err, c) => {
  console.error(err);
  const message = err instanceof Error
    ? err.message
    : "An unexpected error occurred";

  return c.html(
    <ErrorPage
      title="Error"
      message={message}
      returnPath="/"
      returnLabel="Back"
    />,
    500,
  );
});

app.notFound((c) => {
  return c.html(<NotFoundPage />, 404);
});

app.get("/", async (c) => {
  const { ok, error } = getFlash(c);
  const envFiles = await backend.listFiles();

  return await c.html(
    <AppsPage ok={ok} error={error} envFiles={envFiles} />,
  );
});

app.post(
  "/env",
  sValidator(
    "form",
    v.object({
      name: v.pipe(v.string(), v.trim(), v.nonEmpty("Name is required")),
    }),
  ),
  async (c) => {
    const { name: rawName } = c.req.valid("form");

    try {
      const name = normalizeBackendFileName(rawName);
      await backend.createFile(name);
      return redirectWithMessage("/", "ok", `Created ${name}`);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to create env file";
      return redirectWithMessage("/", "error", message);
    }
  },
);

app.get("/env/:name", async (c) => {
  const rawName = c.req.param("name");
  const name = decodeURIComponent(rawName);
  const file = await backend.getFile(name);
  const variables = await backend.listVariables(name);
  const envFile = { name: file.name, variables };
  return await c.html(<EnvFileDetailsPage envFile={envFile} />);
});

app.get(
  "/partial/variable/edit",
  sValidator(
    "query",
    v.object({
      envFileName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
      variableName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
    }),
  ),
  async (c) => {
    const { envFileName, variableName } = c.req.valid("query");
    const variable = await backend.getVariable(envFileName, variableName);
    if (!variable) {
      return c.text("Variable not found", 404);
    }
    return c.html(
      <VariableValueEdit envFileName={envFileName} variable={variable} />,
    );
  },
);

app.get(
  "/partial/variable/display",
  sValidator(
    "query",
    v.object({
      envFileName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
      variableName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
    }),
  ),
  async (c) => {
    const { envFileName, variableName } = c.req.valid("query");
    const variable = await backend.getVariable(envFileName, variableName);
    if (!variable) {
      return c.text("Variable not found", 404);
    }
    return c.html(
      <VariableValueDisplay envFileName={envFileName} variable={variable} />,
    );
  },
);

app.post(
  "/partial/variable/edit",
  sValidator(
    "form",
    v.object({
      envFileName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
      variableName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
      value: v.string(),
    }),
  ),
  async (c) => {
    const { envFileName, variableName, value } = c.req.valid("form");

    await backend.updateVariable(envFileName, variableName, value);
    const variable = await backend.getVariable(envFileName, variableName);
    if (!variable) {
      return c.text("Variable not found after update", 404);
    }

    return c.html(
      <VariableValueDisplay envFileName={envFileName} variable={variable} />,
    );
  },
);

app.post(
  "/partial/variable/generate",
  sValidator(
    "query",
    v.object({
      envFileName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
      variableName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
    }),
  ),
  async (c) => {
    const { envFileName, variableName } = c.req.valid("query");

    await backend.regenerateVariable(envFileName, variableName);
    const variable = await backend.getVariable(envFileName, variableName);
    if (!variable) {
      return c.text("Variable not found after generation", 404);
    }

    return c.html(
      <VariableValueDisplay envFileName={envFileName} variable={variable} />,
    );
  },
);

console.log(`Env Manager listening on :${appEnv.port}`);
Deno.serve({ port: appEnv.port }, app.fetch);
