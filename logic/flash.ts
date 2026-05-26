export type FlashType = "success" | "error";

export type FlashValue = {
  type: FlashType;
  message: string;
};

/** Nullable alias kept for component prop types. */
export type Flash = FlashValue | null;

export const FLASH_COOKIE_NAME = "flash";

declare module "hono" {
  interface ContextVariableMap {
    flash: FlashValue;
  }
}

export function serializeFlash(flash: FlashValue): string {
  return JSON.stringify({ type: flash.type, message: flash.message });
}

export function parseFlash(value: string | undefined): FlashValue | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.type === "success" || parsed.type === "error") &&
      typeof parsed.message === "string"
    ) {
      return { type: parsed.type, message: parsed.message };
    }
  } catch {
    // Ignore malformed cookies
  }
  return null;
}
