import { resolve } from "@std/path";
import {
  type EnvMetadata,
  type EnvVariable,
  serializeEnvFile,
} from "../envFormat.ts";
import type { BackendFile, BackendFileVariable } from "./types.ts";

export async function saveFileInternal(
  rootFolder: string,
  file: BackendFile,
  variables: BackendFileVariable[],
  template: EnvVariable[],
): Promise<void> {
  const variablesWithoutMetadata = removeTemplateMetadata(variables, template);
  const content = serializeEnvFile(variablesWithoutMetadata);
  const path = file.envFilePath
    ? file.envFilePath
    : resolve(rootFolder, file.name);

  await Deno.writeTextFile(path, content);
}

function removeTemplateMetadata(
  variables: BackendFileVariable[],
  template: EnvVariable[],
): EnvVariable[] {
  return variables.map((v): EnvVariable => {
    const fromTemplate = template.find((t) => t.name === v.name);
    if (!fromTemplate) {
      return v;
    }
    const filteredMetadata: EnvMetadata = {
      // Alway include description
      description: v.metadata.description || fromTemplate.metadata.description,
      type: v.metadata.type === fromTemplate.metadata.type
        ? undefined
        : v.metadata.type,
      secret: v.metadata.secret === fromTemplate.metadata.secret
        ? undefined
        : v.metadata.secret,
      required: v.metadata.required === fromTemplate.metadata.required
        ? undefined
        : v.metadata.required,
      length: v.metadata.length === fromTemplate.metadata.length
        ? undefined
        : v.metadata.length,
      generate: v.metadata.generate === fromTemplate.metadata.generate
        ? undefined
        : v.metadata.generate,
    };

    return {
      ...v,
      metadata: filteredMetadata,
    };
  });
}
