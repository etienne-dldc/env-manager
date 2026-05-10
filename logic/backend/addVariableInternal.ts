import type { BackendFile, BackendFileVariable } from "./types.ts";
import { validateValue } from "./validateValue.ts";

export function addVariableInternal(
  file: BackendFile,
  variableName: string,
  value?: string,
): BackendFileVariable {
  const nextVar: BackendFileVariable = {
    name: variableName,
    value: "",
    metadata: {},
    source: "env",
    file,
  };
  nextVar.value = validateValue(nextVar, value ?? "");
  return nextVar;
}
