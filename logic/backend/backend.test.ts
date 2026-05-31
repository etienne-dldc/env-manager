import { expect } from "@std/expect";
import { createBackend } from "./backend.ts";

function file(...lines: string[]): string {
  return lines.join("\n");
}

async function createDirs(): Promise<
  { rootFolder: string; envFileGlob: string; templateSuffixes: string[] }
> {
  const rootFolder = await Deno.makeTempDir({ prefix: "backend-test-" });
  await Deno.mkdir(rootFolder, { recursive: true });

  return {
    rootFolder,
    envFileGlob: "**/.env*",
    templateSuffixes: [".example"],
  };
}

Deno.test("listFiles merges env and template names", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "APP=true");
  await Deno.writeTextFile(`${opts.rootFolder}/.env.local`, "LOCAL=1");
  await Deno.mkdir(`${opts.rootFolder}/.env.dir`, { recursive: true });
  await Deno.writeTextFile(`${opts.rootFolder}/README.md`, "ignore");

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    "# template paired with .env.app",
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.prod.example`, "PROD=1");
  await Deno.writeTextFile(`${opts.rootFolder}/.env.example`, "IGNORE=1");

  const files = await backend.listFiles();
  expect(files.map((f) => f.name)).toEqual([
    ".env",
    ".env.app",
    ".env.local",
    ".env.prod",
  ]);
});

Deno.test("listVariables merges env/template and exposes metadata", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app`,
    file(
      "# @description env description wins",
      "# @secret",
      "API_KEY=real-key",
      "PORT=8080",
      "ONLY_ENV=value",
    ),
  );

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file(
      "# @description template description",
      "# @type string",
      "# @length 12",
      "API_KEY=template-key",
      "# @type number",
      "PORT=3000",
      "# @required",
      "ONLY_TEMPLATE=from-template",
    ),
  );

  const variables = await backend.listVariables(".env.app");
  const byName = new Map(variables.map((v) => [v.name, v]));

  // API_KEY: value from env, metadata merged, secret wins from env
  expect(byName.get("API_KEY")?.value).toEqual("real-key");
  expect(byName.get("API_KEY")?.metadata).toEqual({
    description: "env description wins",
    type: "string",
    length: 12,
    secret: true,
  });

  // PORT: value from env, type from template
  expect(byName.get("PORT")?.value).toEqual("8080");
  expect(byName.get("PORT")?.metadata.type).toEqual("number");
  expect(byName.get("PORT")?.source).toEqual("both");

  // ONLY_ENV: comes only from env file
  expect(byName.get("ONLY_ENV")?.value).toEqual("value");
  expect(byName.get("ONLY_ENV")?.source).toEqual("env");

  // ONLY_TEMPLATE: comes only from template, value empty, exampleValue set
  expect(byName.get("ONLY_TEMPLATE")?.metadata.required).toEqual(true);
  expect(byName.get("ONLY_TEMPLATE")?.source).toEqual("template");
  expect(byName.get("ONLY_TEMPLATE")?.value).toEqual("");
  expect(byName.get("ONLY_TEMPLATE")?.exampleValue).toEqual("from-template");
});

Deno.test("getVariable returns the variable when found", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "FOO=bar");

  const result = await backend.getVariable(".env.app", "FOO");
  expect(result?.name).toEqual("FOO");
  expect(result?.value).toEqual("bar");
});

Deno.test("getVariable returns null for unknown variable", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "FOO=bar");

  const result = await backend.getVariable(".env.app", "MISSING");
  expect(result).toBeNull();
});

Deno.test("addVariable and updateVariable lifecycle", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file(
      "# @generate",
      "# @length 10",
      "GENERATED=template",
    ),
  );

  // Create the env file by adding a variable (file does not exist yet).
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "");

  await backend.addVariable(".env.app", "PLAIN", "hello");
  await backend.addVariable(".env.app", "SECRET", "super-secret");

  await backend.updateVariable(".env.app", "PLAIN", "updated");

  await backend.regenerateVariable(".env.app", "GENERATED");

  const variables = await backend.listVariables(".env.app");
  const byName = new Map(variables.map((v) => [v.name, v]));

  expect(byName.get("PLAIN")?.value).toEqual("updated");
  expect(byName.get("SECRET")?.value).toEqual("super-secret");

  const generated = byName.get("GENERATED")?.value;
  expect(generated).not.toBeUndefined();
  expect(generated).not.toEqual("");
  expect(generated).toHaveLength(10);
});

Deno.test("getFile returns correct source field", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(`${opts.rootFolder}/.env.env-only`, "X=1");
  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.tmpl-only.example`,
    "Y=2",
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.both`, "Z=3");
  await Deno.writeTextFile(`${opts.rootFolder}/.env.both.example`, "Z=0");

  const envOnly = await backend.getFile(".env.env-only");
  expect(envOnly.source).toEqual("env");
  expect(envOnly.envFilePath).not.toBeNull();
  expect(envOnly.templateFilePath).toBeNull();

  const tmplOnly = await backend.getFile(".env.tmpl-only");
  expect(tmplOnly.source).toEqual("template");
  expect(tmplOnly.templateFilePath).not.toBeNull();
  expect(tmplOnly.envFilePath).toBeNull();

  const both = await backend.getFile(".env.both");
  expect(both.source).toEqual("both");
  expect(both.envFilePath).not.toBeNull();
  expect(both.templateFilePath).not.toBeNull();
});

Deno.test("template suffix classification wins over env glob", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  // .env.app.example matches ENV_GLOB but also ends with .example suffix.
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app.example`, "A=1");

  const files = await backend.listFiles();
  expect(files).toHaveLength(1);
  // Name is the base name with the suffix stripped.
  expect(files[0]?.name).toEqual(".env.app");
  expect(files[0]?.source).toEqual("template");
});

Deno.test("regenerateVariable throws when variable has no generate flag", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "PLAIN=value");

  await expect(
    backend.regenerateVariable(".env.app", "PLAIN"),
  ).rejects.toThrow();
});

Deno.test("updateVariable throws for invalid number value", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("# @type number", "PORT=3000"),
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "PORT=8080");

  await expect(
    backend.updateVariable(".env.app", "PORT", "not-a-number"),
  ).rejects.toThrow();
});

Deno.test("updateVariable throws for invalid boolean value", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("# @type boolean", "FLAG=false"),
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "FLAG=true");

  await expect(
    backend.updateVariable(".env.app", "FLAG", "yes"),
  ).rejects.toThrow();
});

Deno.test("updateVariable normalises boolean casing", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("# @type boolean", "FLAG=false"),
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "FLAG=false");

  await backend.updateVariable(".env.app", "FLAG", "TRUE");

  const result = await backend.getVariable(".env.app", "FLAG");
  expect(result?.value).toEqual("true");
});

Deno.test("updateVariable accepts valid JSON and rejects invalid JSON", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("# @type json", "CONFIG={}"),
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "CONFIG={}");

  await backend.updateVariable(".env.app", "CONFIG", '{"key":"value"}');
  const result = await backend.getVariable(".env.app", "CONFIG");
  expect(result?.value).toEqual('{"key":"value"}');

  await expect(
    backend.updateVariable(".env.app", "CONFIG", "not-json"),
  ).rejects.toThrow();
});

Deno.test("updateVariable throws when required variable set to empty", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("# @required", "API_KEY=example"),
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "API_KEY=real");

  await expect(
    backend.updateVariable(".env.app", "API_KEY", ""),
  ).rejects.toThrow();
});

Deno.test("addVariable with no value defaults to empty string", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "");

  await backend.addVariable(".env.app", "UNSET");

  const result = await backend.getVariable(".env.app", "UNSET");
  expect(result?.value).toEqual("");
});

Deno.test("listVariables preserves template order, env-only vars appended", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("FIRST=1", "SECOND=2", "THIRD=3"),
  );
  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app`,
    file("SECOND=b", "FIRST=a", "ENV_ONLY=x"),
  );

  const variables = await backend.listVariables(".env.app");
  expect(variables.map((v) => v.name)).toEqual([
    "FIRST",
    "SECOND",
    "THIRD",
    "ENV_ONLY",
  ]);
});

Deno.test("getFile throws for unknown file name", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await expect(backend.getFile(".env.missing")).rejects.toThrow();
});

Deno.test("template variable updates create env files; deleteFile removes them", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("TOKEN=example"),
  );

  await backend.updateVariable(".env.app", "TOKEN", "created-from-template");

  const created = await backend.getFile(".env.app");
  expect(created.source).toEqual("both");
  expect(created.envFilePath).not.toBeNull();

  let files = await backend.listFiles();
  expect(files.map((entry) => entry.name)).toContain(".env.app");

  await backend.deleteFile(".env.app");

  files = await backend.listFiles();
  expect(files.map((entry) => entry.name)).toContain(".env.app");

  const afterDelete = await backend.getFile(".env.app");
  expect(afterDelete.source).toEqual("template");
  expect(afterDelete.envFilePath).toBeNull();
  expect(afterDelete.templateFilePath).not.toBeNull();
});

Deno.test("regenerateVariable produces different values on repeated calls", async () => {
  const opts = await createDirs();
  const backend = createBackend(opts);

  await Deno.writeTextFile(
    `${opts.rootFolder}/.env.app.example`,
    file("# @generate", "# @length 32", "TOKEN=example"),
  );
  await Deno.writeTextFile(`${opts.rootFolder}/.env.app`, "TOKEN=old");

  await backend.regenerateVariable(".env.app", "TOKEN");
  const first = (await backend.getVariable(".env.app", "TOKEN"))?.value;

  await backend.regenerateVariable(".env.app", "TOKEN");
  const second = (await backend.getVariable(".env.app", "TOKEN"))?.value;

  expect(first).toHaveLength(32);
  expect(second).toHaveLength(32);
  expect(first).not.toEqual(second);
});
