import { resolve } from "@std/path";
import { addVariableInternal } from "./addVariableInternal.ts";
import { listFilesInternal } from "./listFilesInternal.ts";
import { listVariablesInternal } from "./listVariablesInternal.ts";
import { regenerateVariableInternal } from "./regenerateVariableInternal.ts";
import { saveFileInternal } from "./saveFileInternal.ts";
import type { BackendFile, BackendFileVariable } from "./types.ts";
import { updateVariableInternal } from "./updateVariableInternal.ts";

const ENV_FILE_NAME_RE = /^(([^/]+)\/)*.env(\.[^/]+)?$/;

export interface Backend {
  listFiles(): Promise<BackendFile[]>;
  getFile(name: string): Promise<BackendFile>;
  listVariables(name: string): Promise<BackendFileVariable[]>;
  getVariable(
    fileName: string,
    variableName: string,
  ): Promise<BackendFileVariable | null>;
  updateVariable(
    fileName: string,
    variableName: string,
    value: string,
  ): Promise<void>;
  addVariable(
    fileName: string,
    variableName: string,
    value?: string,
  ): Promise<void>;
  regenerateVariable(
    fileName: string,
    variableName: string,
  ): Promise<void>;
  deleteVariable(
    fileName: string,
    variableName: string,
  ): Promise<void>;
  deleteFile(name: string): Promise<void>;
}

export interface BackendOptions {
  envFilesFolder: string;
  envTemplatesFolder: string;
  globPattern: string;
  templateSuffixes: string[];
}

export function createBackend(
  { envFilesFolder, envTemplatesFolder, globPattern, templateSuffixes }:
    BackendOptions,
): Backend {
  return {
    listFiles,
    getFile,
    listVariables,
    getVariable,
    updateVariable,
    addVariable,
    regenerateVariable,
    deleteVariable,
    deleteFile,
  };

  async function listFiles() {
    const { files } = await resolveFiles();
    return files;
  }

  async function getFile(name: string): Promise<BackendFile> {
    const { file } = await resolveFile(name);
    return file;
  }

  async function listVariables(fileName: string) {
    const { variables } = await resolveVariables(fileName);
    return variables;
  }

  async function getVariable(fileName: string, variableName: string) {
    const { variables } = await resolveVariables(fileName);
    return variables.find((v) => v.name === variableName) ?? null;
  }

  async function updateVariable(
    fileName: string,
    variableName: string,
    value: string,
  ) {
    const { variable, saveVariable } = await resolveVariable(
      fileName,
      variableName,
    );
    await saveVariable(updateVariableInternal(variable, value));
  }

  async function addVariable(
    fileName: string,
    variableName: string,
    value?: string,
  ) {
    const { file, variables, saveFile } = await resolveVariables(fileName);
    const variable = addVariableInternal(
      file,
      variableName,
      value,
    );
    await saveFile([...variables, variable]);
  }

  async function regenerateVariable(
    fileName: string,
    variableName: string,
  ) {
    const { variable, saveVariable } = await resolveVariable(
      fileName,
      variableName,
    );
    await saveVariable(regenerateVariableInternal(variable));
  }

  async function deleteVariable(
    fileName: string,
    variableName: string,
  ) {
    const { variables, saveFile } = await resolveVariables(fileName);
    const updatedVariables = variables.filter((v) => v.name !== variableName);
    await saveFile(updatedVariables);
  }

  // async function createFile(name: string) {
  //   const fileName = normalizeBackendFileName(name);
  //   const path = resolve(envFilesFolder, fileName);

  //   // Create parent directories
  //   const parentDir = path.substring(0, path.lastIndexOf("/"));
  //   await Deno.mkdir(parentDir, { recursive: true });

  //   // Create file with createNew to avoid overwriting existing files
  //   try {
  //     await Deno.writeTextFile(path, "", { createNew: true });
  //   } catch (error) {
  //     if (error instanceof Deno.errors.AlreadyExists) {
  //       throw new Error(`File already exists: ${fileName}`);
  //     }
  //     throw error;
  //   }
  // }

  async function deleteFile(name: string) {
    const fileName = normalizeBackendFileName(name);
    const path = resolve(envFilesFolder, fileName);

    try {
      await Deno.remove(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return;
      }
      throw error;
    }
  }

  async function resolveFiles() {
    const files = await listFilesInternal(
      envFilesFolder,
      envTemplatesFolder,
      globPattern,
      templateSuffixes,
    );
    return { files };
  }

  async function resolveFile(fileName: string) {
    const { files } = await resolveFiles();
    const file = files.find((f) => f.name === fileName);
    if (!file) {
      throw new Error(`File not found: ${fileName}`);
    }
    return { files, file };
  }

  async function resolveVariables(fileName: string) {
    const { file, files } = await resolveFile(fileName);
    const { merged, template } = await listVariablesInternal(file);
    const saveFile = (updatedVariables: BackendFileVariable[]) => {
      return saveFileInternal(
        file,
        updatedVariables,
        template,
      );
    };

    return { file, variables: merged, template, files, saveFile };
  }

  async function resolveVariable(fileName: string, variableName: string) {
    const { variables, file, files, saveFile } = await resolveVariables(
      fileName,
    );
    const variable = variables.find((v) => v.name === variableName);
    if (!variable) {
      throw new Error(`Variable ${variableName} not found in file ${fileName}`);
    }
    const saveVariable = (updatedVariable: BackendFileVariable) => {
      const updatedVariables = variables.map((v) =>
        v.name === variableName ? updatedVariable : v
      );
      return saveFile(updatedVariables);
    };

    return { variable, variables, file, files, saveVariable };
  }
}

export function normalizeBackendFileName(rawName: string): string {
  const trimmed = rawName.trim();

  if (!trimmed) {
    throw new Error("Env file name is required");
  }

  // Validate path safety - no .. or leading/trailing slashes
  if (
    trimmed.includes("..") || trimmed.startsWith("/") || trimmed.endsWith("/")
  ) {
    throw new Error(
      `Invalid env file path ${
        JSON.stringify(rawName)
      }. Must not contain '..', start with '/', or end with '/'`,
    );
  }

  // If the path already contains .env, use as-is
  if (trimmed.includes(".env")) {
    if (!ENV_FILE_NAME_RE.test(trimmed)) {
      throw new Error(
        `Invalid env file path ${
          JSON.stringify(rawName)
        }. Expected .env or .env.<name>`,
      );
    }
    return trimmed;
  }

  // Otherwise, append .env prefix to the last component
  const parts = trimmed.split("/");
  const lastPart = parts[parts.length - 1];
  parts[parts.length - 1] = lastPart.startsWith(".env.")
    ? lastPart
    : `.env.${lastPart}`;
  const normalized = parts.join("/");

  if (!ENV_FILE_NAME_RE.test(normalized)) {
    throw new Error(
      `Invalid env file path ${
        JSON.stringify(rawName)
      }. Expected .env or .env.<name>`,
    );
  }

  return normalized;
}
