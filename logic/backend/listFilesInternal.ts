import { expandGlob } from "@std/fs/expand-glob";
import { relative, resolve } from "@std/path";
import type { BackendFile } from "./types.ts";

export async function listFilesInternal(
  envFilesFolder: string,
  envTemplatesFolder: string,
  globPattern: string,
  templateSuffixes: string[],
): Promise<BackendFile[]> {
  // First, find all templates files
  const envNames: { name: string; templatePath: string }[] = [];
  for await (
    const entry of expandGlob(globPattern, {
      globstar: true,
      root: envTemplatesFolder,
    })
  ) {
    if (!entry.isFile) continue;
    const suffix = templateSuffixes.find((suffix) =>
      entry.name.endsWith(suffix)
    );
    if (!suffix) continue;
    const name = relative(envTemplatesFolder, entry.path).slice(
      0,
      -suffix.length,
    );
    const templatePath = resolve(envTemplatesFolder, entry.path);
    envNames.push({ name, templatePath });
  }
  envNames.sort((a, b) => a.name.localeCompare(b.name));
  const backendFiles: BackendFile[] = [];
  for (const { name, templatePath } of envNames) {
    const envFilePath = resolve(envFilesFolder, name);
    const fileExists = await Deno.stat(envFilePath).then(() => true).catch(() =>
      false
    );
    backendFiles.push({
      name,
      templatePath,
      envFilePath,
      fileExists,
    });
  }
  return backendFiles;
}
