import type { BackendFileVariable } from "./types.ts";

export function validateValue(
  variable: BackendFileVariable,
  value: string,
): string {
  if (variable.metadata.required && value.trim() === "") {
    throw new Error(`Value is required for variable: ${variable.name}`);
  }

  const varType = variable.metadata.type ?? "string";
  switch (varType) {
    case "string":
      return value;
    case "number":
      return validateNumber(value);
    case "boolean":
      return validateBoolean(value);
    case "json":
      return validateJson(value);
    default: {
      varType satisfies never;
      throw new Error(`Unsupported variable type: ${varType}`);
    }
  }
}

function validateNumber(value: string): string {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return value;
}

function validateBoolean(value: string): string {
  const lower = value.toLowerCase();
  if (lower === "true" || lower === "false") {
    return lower;
  }
  throw new Error(`Invalid boolean: ${value}`);
}

function validateJson(value: string): string {
  try {
    JSON.parse(value);
    return value;
  } catch {
    throw new Error(`Invalid JSON: ${value}`);
  }
}
