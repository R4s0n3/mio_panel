import { type NextRequest } from "next/server";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { isPanelOwner } from "@/server/auth/owner";
import { db } from "@/server/db";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy": "default-src 'none'; sandbox",
};

/** Relay private CDN bytes only after checking the current authenticated panel owner. */
async function ownerDownload(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id)
    return new Response("Sign in to access this file.", {
      status: 401,
      headers: PRIVATE_HEADERS,
    });
  if (!isPanelOwner(session.user))
    return new Response("Forbidden", { status: 403, headers: PRIVATE_HEADERS });
  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true },
  });
  if (!isPanelOwner(account))
    return new Response("Forbidden", { status: 403, headers: PRIVATE_HEADERS });
  const { fileId } = await context.params;
  if (!fileId || fileId.length > 100)
    return new Response("File not found", {
      status: 404,
      headers: PRIVATE_HEADERS,
    });
  const endpoint = new URL(
    `files/${encodeURIComponent(fileId)}/download`,
    `${env.UPLOAD_URL.replace(/\/+$/, "")}/`,
  );
  if (request.nextUrl.searchParams.get("preview") === "1")
    endpoint.searchParams.set("preview", "1");
  const headers = new Headers({ "X-API-Key": env.UPLOAD_KEY });
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  try {
    const upstream = await fetch(endpoint, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(120000)]),
    });
    if (!upstream.ok)
      return new Response(
        upstream.status === 404
          ? "File not found"
          : "File is temporarily unavailable",
        {
          status: upstream.status === 404 ? 404 : 502,
          headers: PRIVATE_HEADERS,
        },
      );
    const responseHeaders = new Headers(PRIVATE_HEADERS);
    for (const name of [
      "content-type",
      "content-disposition",
      "content-length",
      "content-range",
      "accept-ranges",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return new Response("File is temporarily unavailable", {
      status: 502,
      headers: PRIVATE_HEADERS,
    });
  }
}
export { ownerDownload as GET, ownerDownload as HEAD };
