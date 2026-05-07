import { expect } from "@std/expect";
import {
  createEnvFile,
  deleteEnvFile,
  type EnvFilePaths,
  getEnvFile,
  listEnvFiles,
  SECRET_PLACEHOLDER,
  updateEnvFile,
} from "./envFiles.ts";

function file(...lines: string[]): string {
  return lines.join("\n");
}

async function createPaths(): Promise<EnvFilePaths> {
  const root = await Deno.makeTempDir({ prefix: "env-files-test-" });
  const envFolder = `${root}/env`;
  const envTemplateFolder = `${root}/template`;
  await Deno.mkdir(envFolder, { recursive: true });
  await Deno.mkdir(envTemplateFolder, { recursive: true });
  return { envFolder, envTemplateFolder };
}

Deno.test("listEnvFiles merges env and template names", async () => {
  const paths = await createPaths();

  await Deno.writeTextFile(`${paths.envFolder}/.env.app`, "APP=true");
  await Deno.writeTextFile(`${paths.envFolder}/.env.local`, "LOCAL=1");
  await Deno.mkdir(`${paths.envFolder}/.env.dir`, { recursive: true });
  await Deno.writeTextFile(`${paths.envFolder}/README.md`, "ignore");

  await Deno.writeTextFile(
    `${paths.envTemplateFolder}/.env.app`,
    "# duplicate name from template",
  );
  await Deno.writeTextFile(`${paths.envTemplateFolder}/.env.prod`, "PROD=1");
  await Deno.writeTextFile(`${paths.envTemplateFolder}/.env`, "IGNORE=1");

  const names = await listEnvFiles(paths);

  expect(names).toEqual([".env.app", ".env.local", ".env.prod"]);
});

Deno.test("getEnvFile merges env/template and masks secret values", async () => {
  const paths = await createPaths();

  await Deno.writeTextFile(
    `${paths.envFolder}/.env.app`,
    file(
      "# @description env description wins",
      "# @secret",
      "API_KEY=real-key",
      "PORT=8080",
      "ONLY_ENV=value",
    ),
  );

  await Deno.writeTextFile(
    `${paths.envTemplateFolder}/.env.app`,
    file(
      "# @description template description",
      "# @type string",
      "# @length 12",
      "API_KEY=template-key",
      "# @type number",
      "PORT=3000",
      "# @optional",
      "ONLY_TEMPLATE=from-template",
    ),
  );

  const result = await getEnvFile(".env.app", paths);
  const byName = new Map(result.variables.map((v) => [v.name, v]));

  expect(byName.get("API_KEY")?.value).toEqual(SECRET_PLACEHOLDER);
  expect(byName.get("API_KEY")?.metadata).toEqual({
    description: "env description wins",
    type: "string",
    length: 12,
    secret: true,
  });

  expect(byName.get("PORT")?.value).toEqual("8080");
  expect(byName.get("PORT")?.metadata.type).toEqual("number");
  expect(byName.get("PORT")?.source).toEqual("both");
  expect(byName.get("PORT")?.missingInEnv).toEqual(false);

  expect(byName.get("ONLY_ENV")?.value).toEqual("value");
  expect(byName.get("ONLY_ENV")?.source).toEqual("env");
  expect(byName.get("ONLY_ENV")?.missingInEnv).toEqual(false);

  expect(byName.get("ONLY_TEMPLATE")?.metadata.optional).toEqual(true);
  expect(byName.get("ONLY_TEMPLATE")?.source).toEqual("template");
  expect(byName.get("ONLY_TEMPLATE")?.missingInEnv).toEqual(true);
  expect(byName.get("ONLY_TEMPLATE")?.value).toEqual("");
  expect(byName.get("ONLY_TEMPLATE")?.exampleValue).toEqual("from-template");
});

Deno.test("create/update/delete env file lifecycle", async () => {
  const paths = await createPaths();

  await Deno.writeTextFile(
    `${paths.envTemplateFolder}/.env.app`,
    file(
      "# @type string",
      "# @length 10",
      "GENERATED=template",
    ),
  );

  await createEnvFile(".env.app", paths);

  await updateEnvFile(
    ".env.app",
    [
      { type: "addVariable", name: "PLAIN", value: "hello" },
      {
        type: "addVariable",
        name: "SECRET",
        value: "super-secret",
        metadata: { secret: true },
      },
      { type: "updateValue", name: "PLAIN", value: "updated" },
      { type: "generateValue", name: "GENERATED" },
      { type: "generateValue", name: "EXPLICIT", length: 6 },
    ],
    paths,
  );

  const updated = await getEnvFile(".env.app", paths);
  const byName = new Map(updated.variables.map((v) => [v.name, v]));

  expect(byName.get("PLAIN")?.value).toEqual("updated");
  expect(byName.get("SECRET")?.value).toEqual(SECRET_PLACEHOLDER);

  const generated = byName.get("GENERATED")?.value;
  expect(generated).not.toBeUndefined();
  expect(generated).toHaveLength(10);

  const explicit = byName.get("EXPLICIT")?.value;
  expect(explicit).not.toBeUndefined();
  expect(explicit).toHaveLength(6);

  await deleteEnvFile(".env.app", paths);
  const names = await listEnvFiles(paths);
  expect(names).toEqual([".env.app"]);
});
