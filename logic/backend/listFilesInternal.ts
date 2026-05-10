import { resolve } from "@std/path";
import type { BackendFile } from "./types.ts";

export async function listFilesInternal(
  envFilesFolder: string,
  envTemplatesFolder: string,
): Promise<BackendFile[]> {
  const [envFiles, envTemplates] = await Promise.all([
    listEnvFileNamesInFolder(envFilesFolder),
    listEnvFileNamesInFolder(envTemplatesFolder),
  ]);

  const allNames = Array.from(new Set([...envFiles, ...envTemplates])).sort();

  return allNames.map((name): BackendFile => {
    const inEnv = envFiles.includes(name);
    const inTemplate = envTemplates.includes(name);

    if (inEnv && inTemplate) {
      return {
        name,
        source: "both",
        envFilePath: resolve(envFilesFolder, name),
        templateFilePath: resolve(envTemplatesFolder, name),
      };
    }
    if (inEnv) {
      return {
        name,
        source: "env",
        envFilePath: resolve(envFilesFolder, name),
        templateFilePath: null,
      };
    }
    return {
      name,
      source: "template",
      templateFilePath: resolve(envTemplatesFolder, name),
      envFilePath: null,
    };
  });
}

async function listEnvFileNamesInFolder(folder: string): Promise<string[]> {
  const names: string[] = [];
  try {
    for await (const entry of Deno.readDir(folder)) {
      if (!entry.isFile) {
        continue;
      }
      if (entry.name === ".env" || entry.name.startsWith(".env.")) {
        names.push(entry.name);
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }
  return names;
}
