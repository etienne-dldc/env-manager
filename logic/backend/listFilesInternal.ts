import { globToRegExp, relative, resolve } from "@std/path";
import type { BackendFile } from "./types.ts";

export async function listFilesInternal(
  rootFolder: string,
  envFileGlob: string,
  templateSuffixes: string[],
): Promise<BackendFile[]> {
  const allFiles = await listFilesUnderRoot(rootFolder);
  const envRegex = globToRegExp(envFileGlob, {
    extended: true,
    globstar: true,
  });

  // Longest suffix first so more specific suffixes take precedence.
  const sortedSuffixes = [...templateSuffixes].sort((a, b) =>
    b.length - a.length
  );

  const envFileSet = new Set<string>();
  // Maps base name (intended env relative path) → template relative path.
  const templateByBaseName = new Map<string, string>();

  for (const file of allFiles) {
    const matchingSuffix = sortedSuffixes.find((s) => file.endsWith(s));
    if (matchingSuffix) {
      const baseName = file.slice(0, -matchingSuffix.length);
      // First match wins when multiple templates resolve to the same base name.
      if (!templateByBaseName.has(baseName)) {
        templateByBaseName.set(baseName, file);
      }
      continue;
    }
    if (envRegex.test(file)) {
      envFileSet.add(file);
    }
  }

  const results: BackendFile[] = [];

  for (const envFile of envFileSet) {
    const templateRelPath = templateByBaseName.get(envFile);
    if (templateRelPath) {
      results.push({
        name: envFile,
        source: "both",
        envFilePath: resolve(rootFolder, envFile),
        templateFilePath: resolve(rootFolder, templateRelPath),
      });
    } else {
      results.push({
        name: envFile,
        source: "env",
        envFilePath: resolve(rootFolder, envFile),
        templateFilePath: null,
      });
    }
  }

  // Template-only: base name is the intended env name (suffix already stripped).
  for (const [baseName, templateRelPath] of templateByBaseName) {
    if (!envFileSet.has(baseName)) {
      results.push({
        name: baseName,
        source: "template",
        envFilePath: null,
        templateFilePath: resolve(rootFolder, templateRelPath),
      });
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

async function listFilesUnderRoot(rootFolder: string): Promise<string[]> {
  const names: string[] = [];

  try {
    await walkDir(rootFolder, (absolutePath) => {
      const relPath = relative(rootFolder, absolutePath);
      names.push(relPath);
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }

  return names.sort((a, b) => a.localeCompare(b));
}

async function walkDir(
  rootFolder: string,
  onFile: (absolutePath: string) => Promise<void> | void,
): Promise<void> {
  for await (const entry of Deno.readDir(rootFolder)) {
    const absolutePath = resolve(rootFolder, entry.name);

    if (entry.isDirectory) {
      await walkDir(absolutePath, onFile);
      continue;
    }

    if (!entry.isFile) {
      continue;
    }

    await onFile(absolutePath);
  }
}
