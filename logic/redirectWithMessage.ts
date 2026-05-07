export function redirectWithMessage(
  path: string,
  type: "ok" | "error",
  message: string,
): Response {
  const hashIndex = path.indexOf("#");
  const hasHash = hashIndex >= 0;
  const hash = hasHash ? path.slice(hashIndex) : "";
  const pathWithoutHash = hasHash ? path.slice(0, hashIndex) : path;

  const queryIndex = pathWithoutHash.indexOf("?");
  const hasQuery = queryIndex >= 0;
  const pathname = hasQuery
    ? pathWithoutHash.slice(0, queryIndex)
    : pathWithoutHash;
  const rawQuery = hasQuery ? pathWithoutHash.slice(queryIndex + 1) : "";

  const searchParams = new URLSearchParams(rawQuery);
  searchParams.set(type, message);

  const query = searchParams.toString();
  const location = `${pathname}${query ? `?${query}` : ""}${hash}`;

  return new Response(null, {
    status: 303,
    headers: {
      location,
      "cache-control": "no-store",
    },
  });
}
