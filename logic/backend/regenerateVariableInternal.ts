import type { BackendFileVariable } from "./types.ts";

export function regenerateVariableInternal(
  variable: BackendFileVariable,
): BackendFileVariable {
  if (!variable.metadata.generate) {
    throw new Error(
      `Variable ${variable.name} is not marked as generate, cannot be regenerated`,
    );
  }
  const length = variable.metadata.length ?? 32;
  const newValue = generateRandomString(length);
  return { ...variable, value: newValue };
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
