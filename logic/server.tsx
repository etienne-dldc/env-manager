import { sValidator } from "@hono/standard-validator";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import * as v from "@valibot/valibot";
import { type Context, Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { serveStatic } from "hono/deno";
import { routePath } from "hono/route";
import console from "node:console";
import { VariableValueDisplay } from "../components/EnvVariableItem/VariableValueDisplay.tsx";
import { VariableValueEdit } from "../components/EnvVariableItem/VariableValueEdit.tsx";
import { EnvFileDetailsPage } from "../views/EnvFileDetailsPage.tsx";
import { ErrorPage } from "../views/ErrorPage.tsx";
import { HomePage } from "../views/HomePage.tsx";
import { NotFoundPage } from "../views/NotFoundPage.tsx";
import { createBackend } from "./backend/backend.ts";
import type { AppConfig } from "./config/type.ts";
import { FLASH_COOKIE_NAME, getFlash, parseFlash, setFlash } from "./flash.ts";
import { redirect } from "./redirectTo.ts";

export function createServer(config: AppConfig) {
  const backend = createBackend({
    envFilesFolder: config.envFolder,
    envTemplatesFolder: config.envTemplateFolder,
    globPattern: config.globPattern,
    templateSuffixes: config.templateSuffixes,
  });

  const app = new Hono();

  app.use("*", async (c, next) => {
    const flashCookie = getCookie(c, FLASH_COOKIE_NAME);
    const flash = parseFlash(flashCookie);
    if (flash) {
      setFlash(c, flash.type, flash.message);
    }
    await next();
  });

  function renderPage(
    c: Context,
    fn: () => Response | Promise<Response>,
  ): Response | Promise<Response> {
    if (c.get("flash")) {
      deleteCookie(c, FLASH_COOKIE_NAME, { path: "/" });
    }
    return fn();
  }

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
    serveStatic({ root: "../" }),
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
    const envFiles = await backend.listFiles();
    return renderPage(
      c,
      () => c.html(<HomePage flash={getFlash(c)} envFiles={envFiles} />),
    );
  });

  app.post(
    "/env/:name/variable",
    sValidator(
      "form",
      v.object({
        variableName: v.pipe(
          v.string(),
          v.trim(),
          v.nonEmpty("Variable name is required"),
        ),
      }),
    ),
    async (c) => {
      const rawName = c.req.param("name");
      const name = decodeURIComponent(rawName);
      const { variableName } = c.req.valid("form");
      const redirectBase = `/env/${encodeURIComponent(name)}`;

      try {
        await backend.addVariable(name, variableName);
        setFlash(c, "success", `Added ${variableName}`);
        return redirect(c, redirectBase);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "Failed to add variable";
        setFlash(c, "error", message);
        return redirect(c, redirectBase);
      }
    },
  );

  app.post("/env/:name/delete", async (c) => {
    const rawName = c.req.param("name");
    const name = decodeURIComponent(rawName);
    await backend.deleteFile(name);
    setFlash(c, "success", `Deleted ${name}`);
    return redirect(c, "/");
  });

  app.post("/env/:name/variable/:variableName/delete", async (c) => {
    const name = decodeURIComponent(c.req.param("name"));
    const variableName = decodeURIComponent(c.req.param("variableName"));
    await backend.deleteVariable(name, variableName);
    return c.body(null, 200);
  });

  app.get("/env/:name", async (c) => {
    const rawName = c.req.param("name");
    const name = decodeURIComponent(rawName);
    const file = await backend.getFile(name);
    const variables = await backend.listVariables(name);
    return renderPage(
      c,
      () =>
        c.html(
          <EnvFileDetailsPage
            envFile={{ name: file.name, variables }}
            flash={getFlash(c)}
          />,
        ),
    );
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
        value: v.optional(v.string()),
      }),
    ),
    async (c) => {
      const { envFileName, variableName, value } = c.req.valid("form");

      try {
        await backend.updateVariable(envFileName, variableName, value ?? "");
      } catch (error) {
        console.error(error);
      }
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

      try {
        await backend.regenerateVariable(envFileName, variableName);
      } catch (error) {
        console.error(error);
      }
      const variable = await backend.getVariable(envFileName, variableName);
      if (!variable) {
        return c.text("Variable not found after generation", 404);
      }

      return c.html(
        <VariableValueDisplay envFileName={envFileName} variable={variable} />,
      );
    },
  );

  return app;
}
