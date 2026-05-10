import type { BackendFileVariable } from "./types.ts";
import { validateValue } from "./validateValue.ts";

export function updateVariableInternal(
  variable: BackendFileVariable,
  value: string,
): BackendFileVariable {
  const updateValue = validateValue(variable, value);
  return { ...variable, value: updateValue };
}
