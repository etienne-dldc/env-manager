import { type EnvVariable, parseEnvFile } from "../envFormat.ts";
import type { BackendFile, BackendFileVariable } from "./types.ts";

export async function listVariablesInternal(
  file: BackendFile,
): Promise<{ merged: BackendFileVariable[]; template: EnvVariable[] }> {
  const [envRaw, templateRaw] = await Promise.all([
    file.fileExists ? Deno.readTextFile(file.envFilePath) : null,
    Deno.readTextFile(file.templatePath),
  ]);

  const templateVariables = parseEnvFile(templateRaw);

  return {
    merged: mergeVariableMaps(
      file,
      envRaw ? parseEnvFile(envRaw) : null,
      templateVariables,
    ),
    template: templateVariables,
  };
}

function mergeVariableMaps(
  file: BackendFile,
  envVariables: EnvVariable[] | null,
  templateVariables: EnvVariable[] | null,
): BackendFileVariable[] {
  if (!envVariables && !templateVariables) {
    return [];
  }
  if (!envVariables) {
    envVariables = [];
  }
  if (!templateVariables) {
    templateVariables = [];
  }

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

  return names.map((name): BackendFileVariable => {
    const fromTemplate = templateByName.get(name);
    const fromEnv = envByName.get(name);

    if (fromTemplate && fromEnv) {
      return {
        name,
        value: fromEnv.value,
        // Env metadata overrides template metadata when present.
        metadata: { ...fromTemplate.metadata, ...fromEnv.metadata },
        source: "both",
        exampleValue: fromTemplate.value,
        file,
      };
    }

    if (fromEnv) {
      return {
        ...fromEnv,
        source: "env",
        file,
      };
    }

    if (fromTemplate) {
      return {
        ...fromTemplate,
        value: "",
        source: "template",
        file,
        exampleValue: fromTemplate.value,
      };
    }

    // This branch is unreachable because names are built from both maps.
    throw new Error(`Unexpected missing variable ${JSON.stringify(name)}`);
  });
}
