import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";

const FLASH_COOKIE_NAME = "flash";
const FLASH_COOKIE_PATH = "/";

type FlashType = "ok" | "error";

type FlashMessage = {
  type: FlashType;
  message: string;
};

export function setFlash(
  c: Context,
  type: FlashType,
  message: string,
): void {
  const flash: FlashMessage = { type, message };
  setCookie(c, FLASH_COOKIE_NAME, JSON.stringify(flash), {
    path: FLASH_COOKIE_PATH,
    httpOnly: true,
    sameSite: "Lax",
  });
}

export function getFlash(
  c: Context,
): { ok: string | null; error: string | null } {
  const cookie = getCookie(c, FLASH_COOKIE_NAME);
  deleteCookie(c, FLASH_COOKIE_NAME, { path: FLASH_COOKIE_PATH });

  if (!cookie) {
    return { ok: null, error: null };
  }

  try {
    const flash: FlashMessage = JSON.parse(cookie);
    return {
      ok: flash.type === "ok" ? flash.message : null,
      error: flash.type === "error" ? flash.message : null,
    };
  } catch {
    return { ok: null, error: null };
  }
}
