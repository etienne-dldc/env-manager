import { SpanStatusCode, trace } from "@opentelemetry/api";
import { type Context, Hono } from "hono";
import { serveStatic } from "hono/deno";
import { routePath } from "hono/route";
import denoJson from "./deno.json" with { type: "json" };
import { appEnv, logEnvConfiguration } from "./logic/env.ts";
import {
  createEnvFile,
  getEnvFile,
  listEnvFilesDetailed,
  normalizeEnvFileName,
} from "./logic/envFiles.ts";
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
  serveStatic({
    root: "./",
  }),
);

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
    { "cache-control": "no-store" },
  );
});

app.notFound((c) => {
  return c.html(<NotFoundPage />, 404, {
    "cache-control": "no-store",
  });
});

app.get("/", async (c) => {
  const { ok, error } = getFlash(c);
  const envFiles = await listEnvFilesDetailed();

  return await c.html(
    <AppsPage
      ok={ok}
      error={error}
      envFiles={envFiles}
    />,
    200,
    { "cache-control": "no-store" },
  );
});

app.post("/env", async (c) => {
  const body = await c.req.parseBody();
  const rawName = typeof body.name === "string" ? body.name : "";

  try {
    const name = normalizeEnvFileName(rawName);
    await createEnvFile(name);
    return redirectWithMessage(
      "/",
      "ok",
      `Created ${name}`,
    );
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Failed to create env file";
    return redirectWithMessage("/", "error", message);
  }
});

app.get("/env/:name", async (c) => {
  const rawName = c.req.param("name");
  const name = decodeURIComponent(rawName);

  const envFile = await getEnvFile(name);

  return await c.html(
    <EnvFileDetailsPage envFile={envFile} />,
    200,
    { "cache-control": "no-store" },
  );
});

console.log(`Env Manager listening on :${appEnv.port}`);
Deno.serve({ port: appEnv.port }, app.fetch);
