import { expect } from "@std/expect";
import {
  type EnvVariable,
  parseEnvFile,
  serializeEnvFile,
} from "./envFormat.ts";

function file(...lines: string[]): string {
  return lines.join("\n");
}

Deno.test("parseEnvFile", async (t) => {
  await t.step("simple variable", () => {
    const content = "PORT=3000";
    const result = parseEnvFile(content);

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("PORT");
    expect(result[0].value).toEqual("3000");
    expect(result[0].metadata).toEqual({});
  });

  await t.step("variable with description", () => {
    const content = file(
      "# @description The port the app listens on",
      "PORT=3000",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("PORT");
    expect(result[0].metadata.description).toEqual(
      "The port the app listens on",
    );
  });

  await t.step("all metadata types", () => {
    const content = file(
      "# @description Database secret",
      "# @type string",
      "# @secret",
      "# @length 32",
      "DB_PASSWORD=supersecret",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("DB_PASSWORD");
    expect(result[0].value).toEqual("supersecret");
    expect(result[0].metadata.description).toEqual("Database secret");
    expect(result[0].metadata.type).toEqual("string");
    expect(result[0].metadata.secret).toEqual(true);
    expect(result[0].metadata.length).toEqual(32);
  });

  await t.step("all supported types", () => {
    const content = file(
      "# @type string",
      "STRING_VAR=hello",
      "# @type number",
      "NUMBER_VAR=42",
      "# @type boolean",
      "BOOL_VAR=true",
      "# @type json",
      'JSON_VAR={"key":"value"}',
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(4);
    expect(result[0].metadata.type).toEqual("string");
    expect(result[1].metadata.type).toEqual("number");
    expect(result[2].metadata.type).toEqual("boolean");
    expect(result[3].metadata.type).toEqual("json");
  });

  await t.step("multiple variables with spacing", () => {
    const content = file(
      "# @description First variable",
      "VAR1=value1",
      "",
      "# @description Second variable",
      "VAR2=value2",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(2);
    expect(result[0].name).toEqual("VAR1");
    expect(result[0].metadata.description).toEqual("First variable");
    expect(result[1].name).toEqual("VAR2");
    expect(result[1].metadata.description).toEqual("Second variable");
  });

  await t.step("required and generate flags", () => {
    const content = file(
      "# @required",
      "# @generate",
      "API_KEY=generated_key",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(1);
    expect(result[0].metadata.required).toEqual(true);
    expect(result[0].metadata.generate).toEqual(true);
  });

  await t.step("invalid variable names are skipped", () => {
    const content = file(
      "# @description Valid",
      "VALID_NAME=value1",
      "",
      "# @description Invalid - starts with number",
      "123INVALID=value2",
      "",
      "# @description Invalid - has dash",
      "INVALID-NAME=value3",
      "",
      "# @description Valid",
      "ANOTHER_VALID=value4",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(2);
    expect(result[0].name).toEqual("VALID_NAME");
    expect(result[1].name).toEqual("ANOTHER_VALID");
  });

  await t.step("empty file", () => {
    const content = "";
    const result = parseEnvFile(content);

    expect(result.length).toEqual(0);
  });

  await t.step("only comments", () => {
    const content = file(
      "# This is a comment",
      "# Another comment",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(0);
  });

  await t.step("value with equals sign", () => {
    const content = file(
      "DATABASE_URL=postgres://user:pass=123@localhost:5432/db",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("DATABASE_URL");
    expect(result[0].value).toEqual(
      "postgres://user:pass=123@localhost:5432/db",
    );
  });

  await t.step("case insensitive variable names", () => {
    const content = file(
      "port=3000",
      "PORT=8000",
      "Port=5000",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(3);
    expect(result[0].name).toEqual("port");
    expect(result[1].name).toEqual("PORT");
    expect(result[2].name).toEqual("Port");
  });

  await t.step("whitespace handling", () => {
    const content = file(
      "  VAR_WITH_SPACES  =  value_with_spaces  ",
    );
    const result = parseEnvFile(content);

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("VAR_WITH_SPACES");
    // Value preserves the trailing spaces after =
    expect(result[0].value).toEqual("  value_with_spaces  ");
  });
});

Deno.test("serializeEnvFile", async (t) => {
  await t.step("single variable", () => {
    const variables: EnvVariable[] = [
      {
        name: "PORT",
        value: "3000",
        metadata: {},
      },
    ];
    const result = serializeEnvFile(variables);

    expect(result).toEqual("PORT=3000\n");
  });

  await t.step("variable with metadata", () => {
    const variables: EnvVariable[] = [
      {
        name: "DB_PASSWORD",
        value: "supersecret",
        metadata: {
          description: "Database secret",
          type: "string",
          secret: true,
          length: 32,
        },
      },
    ];
    const result = serializeEnvFile(variables);
    const expected = file(
      "# @description Database secret",
      "# @type string",
      "# @secret",
      "# @length 32",
      "DB_PASSWORD=supersecret",
    ) + "\n";

    expect(result).toEqual(expected);
  });

  await t.step("multiple variables", () => {
    const variables: EnvVariable[] = [
      {
        name: "VAR1",
        value: "value1",
        metadata: { description: "First" },
      },
      {
        name: "VAR2",
        value: "value2",
        metadata: { description: "Second" },
      },
    ];
    const result = serializeEnvFile(variables);
    const expected = file(
      "# @description First",
      "VAR1=value1",
      "",
      "# @description Second",
      "VAR2=value2",
    ) + "\n";

    expect(result).toEqual(expected);
  });

  await t.step("all flags", () => {
    const variables: EnvVariable[] = [
      {
        name: "SECURE_KEY",
        value: "key_value",
        metadata: {
          description: "A secure key",
          type: "json",
          secret: true,
          required: true,
          length: 64,
          generate: true,
        },
      },
    ];
    const result = serializeEnvFile(variables);
    const expected = file(
      "# @description A secure key",
      "# @type json",
      "# @secret",
      "# @required",
      "# @length 64",
      "# @generate",
      "SECURE_KEY=key_value",
    ) + "\n";

    expect(result).toEqual(expected);
  });

  await t.step("empty array", () => {
    const result = serializeEnvFile([]);

    expect(result).toEqual("");
  });
});

Deno.test("round-trip - parse and serialize", () => {
  const original = file(
    "# @description The port",
    "# @type number",
    "PORT=3000",
    "",
    "# @description Database password",
    "# @type string",
    "# @secret",
    "# @length 32",
    "DB_PASSWORD=secret123",
  );

  const parsed = parseEnvFile(original);
  const serialized = serializeEnvFile(parsed);
  const reparsed = parseEnvFile(serialized);

  expect(parsed).toEqual(reparsed);
});
