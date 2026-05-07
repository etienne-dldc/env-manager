export function redirectTo(path: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      location: path,
      "cache-control": "no-store",
    },
  });
}
