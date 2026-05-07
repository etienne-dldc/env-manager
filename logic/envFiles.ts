import { resolve } from "@std/path";
import { appEnv } from "./env.ts";
import {
  type EnvMetadata,
  type EnvVariable,
  parseEnvFile,
  serializeEnvFile,
} from "./envFormat.ts";

export const SECRET_PLACEHOLDER = "******";

const ENV_FILE_NAME_RE = /^\.env\.[^/]+$/;

export type EnvFilePaths = {
  envFolder: string;
  envTemplateFolder: string;
};

export type EnvFileListItem = {
  name: string;
  source: "env" | "template" | "both";
  missingInEnv: boolean;
};

export type EnvFileVariable = EnvVariable & {
  source: "env" | "template" | "both";
  missingInEnv: boolean;
  exampleValue?: string;
};

export type EnvFileUpdateAction =
  | {
    type: "updateValue";
    name: string;
    value: string;
  }
  | {
    type: "addVariable";
    name: string;
    value?: string;
    metadata?: EnvMetadata;
  }
  | {
    type: "generateValue";
    name: string;
    length?: number;
  };

function getDefaultPaths(): EnvFilePaths {
  return {
    envFolder: appEnv.envFolder,
    envTemplateFolder: appEnv.envTemplateFolder,
  };
}

function isMissingError(error: unknown): boolean {
  return error instanceof Deno.errors.NotFound;
}

function validateEnvFileName(name: string): void {
  if (!ENV_FILE_NAME_RE.test(name)) {
    throw new Error(
      `Invalid env file name ${JSON.stringify(name)}. Expected .env.<name>`,
    );
  }
}

export function normalizeEnvFileName(rawName: string): string {
  const trimmed = rawName.trim();

  if (!trimmed) {
    throw new Error("Env file name is required");
  }

  if (trimmed === ".env") {
    validateEnvFileName(trimmed);
  }

  const normalized = trimmed.startsWith(".env.") ? trimmed : `.env.${trimmed}`;
  validateEnvFileName(normalized);
  return normalized;
}

function envFilePath(folder: string, name: string): string {
  validateEnvFileName(name);
  return resolve(folder, name);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch (error) {
    if (isMissingError(error)) {
      return false;
    }
    throw error;
  }
}

async function readFileOrEmpty(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (isMissingError(error)) {
      return "";
    }

    throw error;
  }
}

async function listEnvFileNamesInFolder(folder: string): Promise<string[]> {
  const names: string[] = [];

  try {
    for await (const entry of Deno.readDir(folder)) {
      if (!entry.isFile) {
        continue;
      }

      if (!ENV_FILE_NAME_RE.test(entry.name)) {
        continue;
      }

      names.push(entry.name);
    }
  } catch (error) {
    if (isMissingError(error)) {
      return [];
    }

    throw error;
  }

  return names;
}

function mergeVariableMaps(
  envVariables: EnvVariable[],
  templateVariables: EnvVariable[],
): EnvFileVariable[] {
  const templateByName = new Map(templateVariables.map((v) => [v.name, v]));
  const envByName = new Map(envVariables.map((v) => [v.name, v]));

  const names: string[] = [];
  for (const v of templateVariables) {
    names.push(v.name);
  }

  for (const v of envVariables) {
    if (!templateByName.has(v.name)) {
      names.push(v.name);
    }
  }

  return names.map((name) => {
    const fromTemplate = templateByName.get(name);
    const fromEnv = envByName.get(name);

    if (fromTemplate && fromEnv) {
      return {
        name,
        value: fromEnv.value,
        // Env metadata overrides template metadata when present.
        metadata: { ...fromTemplate.metadata, ...fromEnv.metadata },
        source: "both",
        missingInEnv: false,
        exampleValue: fromTemplate.value,
      };
    }

    if (fromEnv) {
      return {
        ...fromEnv,
        source: "env",
        missingInEnv: false,
      };
    }

    if (fromTemplate) {
      return {
        ...fromTemplate,
        value: "",
        source: "template",
        missingInEnv: true,
        exampleValue: fromTemplate.value,
      };
    }

    // This branch is unreachable because names are built from both maps.
    throw new Error(`Unexpected missing variable ${JSON.stringify(name)}`);
  });
}

function maskSecrets(variables: EnvFileVariable[]): EnvFileVariable[] {
  return variables.map((variable) => ({
    ...variable,
    value: variable.metadata.secret && !variable.missingInEnv
      ? SECRET_PLACEHOLDER
      : variable.value,
  }));
}

function generateRandomString(length: number): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let out = "";
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }

  return out;
}

function upsertVariable(
  variables: EnvVariable[],
  name: string,
  updater: (current: EnvVariable | undefined) => EnvVariable,
): EnvVariable[] {
  const index = variables.findIndex((v) => v.name === name);
  if (index === -1) {
    return [...variables, updater(undefined)];
  }

  const next = [...variables];
  next[index] = updater(next[index]);
  return next;
}

export async function listEnvFiles(
  paths: EnvFilePaths = getDefaultPaths(),
): Promise<string[]> {
  const files = await listEnvFilesDetailed(paths);
  return files.map((file) => file.name);
}

export async function listEnvFilesDetailed(
  paths: EnvFilePaths = getDefaultPaths(),
): Promise<EnvFileListItem[]> {
  const [envNames, templateNames] = await Promise.all([
    listEnvFileNamesInFolder(paths.envFolder),
    listEnvFileNamesInFolder(paths.envTemplateFolder),
  ]);

  const envSet = new Set(envNames);
  const templateSet = new Set(templateNames);

  return [...new Set([...envNames, ...templateNames])]
    .sort()
    .map((name) => {
      const inEnv = envSet.has(name);
      const inTemplate = templateSet.has(name);

      return {
        name,
        source: inEnv && inTemplate ? "both" : inEnv ? "env" : "template",
        missingInEnv: !inEnv && inTemplate,
      };
    });
}

export async function createEnvFile(
  name: string,
  paths: EnvFilePaths = getDefaultPaths(),
): Promise<void> {
  const path = envFilePath(paths.envFolder, name);
  if (await fileExists(path)) {
    throw new Error(`Env file already exists: ${name}`);
  }

  await Deno.mkdir(paths.envFolder, { recursive: true });
  await Deno.writeTextFile(path, "", { createNew: true });
}

export async function getEnvFile(
  name: string,
  paths: EnvFilePaths = getDefaultPaths(),
): Promise<{ name: string; variables: EnvFileVariable[] }> {
  const envPath = envFilePath(paths.envFolder, name);
  const templatePath = envFilePath(paths.envTemplateFolder, name);

  const [envRaw, templateRaw] = await Promise.all([
    readFileOrEmpty(envPath),
    readFileOrEmpty(templatePath),
  ]);

  const merged = mergeVariableMaps(
    parseEnvFile(envRaw),
    parseEnvFile(templateRaw),
  );
  return {
    name,
    variables: maskSecrets(merged),
  };
}

export async function updateEnvFile(
  name: string,
  actions: EnvFileUpdateAction[],
  paths: EnvFilePaths = getDefaultPaths(),
): Promise<{ name: string; variables: EnvFileVariable[] }> {
  const envPath = envFilePath(paths.envFolder, name);
  const templatePath = envFilePath(paths.envTemplateFolder, name);

  await Deno.mkdir(paths.envFolder, { recursive: true });

  const [envRaw, templateRaw] = await Promise.all([
    readFileOrEmpty(envPath),
    readFileOrEmpty(templatePath),
  ]);

  let envVariables = parseEnvFile(envRaw);
  const templateVariables = parseEnvFile(templateRaw);
  const templateByName = new Map(templateVariables.map((v) => [v.name, v]));

  for (const action of actions) {
    switch (action.type) {
      case "updateValue": {
        envVariables = upsertVariable(envVariables, action.name, (current) => ({
          name: action.name,
          value: action.value,
          metadata: current?.metadata ?? {},
        }));
        break;
      }
      case "addVariable": {
        if (envVariables.some((v) => v.name === action.name)) {
          throw new Error(`Variable already exists: ${action.name}`);
        }

        envVariables = [
          ...envVariables,
          {
            name: action.name,
            value: action.value ?? "",
            metadata: action.metadata ? { ...action.metadata } : {},
          },
        ];
        break;
      }
      case "generateValue": {
        const source = envVariables.find((v) => v.name === action.name) ??
          templateByName.get(action.name);
        const fallbackLength = source?.metadata.length ?? 32;
        const length = action.length ?? fallbackLength;

        if (!Number.isInteger(length) || length < 1) {
          throw new Error(`Invalid length for generated value: ${length}`);
        }

        envVariables = upsertVariable(envVariables, action.name, (current) => ({
          name: action.name,
          value: generateRandomString(length),
          metadata: current?.metadata ?? {},
        }));
        break;
      }
      default: {
        const _exhaustiveCheck: never = action;
        throw new Error(
          `Unsupported update action: ${JSON.stringify(_exhaustiveCheck)}`,
        );
      }
    }
  }

  await Deno.writeTextFile(envPath, serializeEnvFile(envVariables));
  const merged = mergeVariableMaps(envVariables, templateVariables);

  return {
    name,
    variables: maskSecrets(merged),
  };
}

export async function deleteEnvFile(
  name: string,
  paths: EnvFilePaths = getDefaultPaths(),
): Promise<void> {
  const path = envFilePath(paths.envFolder, name);

  try {
    await Deno.remove(path);
  } catch (error) {
    if (isMissingError(error)) {
      return;
    }

    throw error;
  }
}
