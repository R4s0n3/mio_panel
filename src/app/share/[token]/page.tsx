import { type Metadata } from "next";
import {
  cdnShareUrl,
  publicShareSchema,
  SHARE_TOKEN,
} from "@/server/cdn-shares";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shared files · Mio",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};
function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** A public bearer-link page; it reveals only files selected by the panel owner. */
export default async function SharedMediaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let share: ReturnType<typeof publicShareSchema.parse> | undefined;
  let unavailable = false;
  if (SHARE_TOKEN.test(token)) {
    try {
      const response = await fetch(cdnShareUrl(token), {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) share = publicShareSchema.parse(await response.json());
      else unavailable = response.status === 404;
    } catch {
      /* Show a recoverable error without logging bearer tokens. */
    }
  } else unavailable = true;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-700 to-primary-900 px-4 py-12 text-headings">
      <section className="w-full max-w-2xl space-y-6 rounded-xl border border-highlight-cyan/20 bg-surface p-6 sm:p-10">
        <p className="font-subhead text-xs uppercase tracking-widest text-highlight-cyan">
          Mio · Shared files
        </p>
        {!share ? (
          <>
            <h1 className="font-headline text-4xl">
              {unavailable
                ? "This link is unavailable"
                : "Downloads are temporarily unavailable"}
            </h1>
            <p className="text-body/70">
              {unavailable
                ? "The link may have expired or been revoked. Please ask the sender for a new link."
                : "Please refresh this page and try again shortly."}
            </p>
          </>
        ) : (
          <>
            <header className="space-y-2">
              <h1 className="break-words font-headline text-4xl">
                {share.title}
              </h1>
              <p className="text-sm text-body/60">
                {share.files.length} files · Available until{" "}
                {new Date(share.expiresAt).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC
              </p>
            </header>
            <ul className="divide-y divide-body/10">
              {share.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <h2 className="break-words font-subhead">{file.name}</h2>
                    <p className="text-sm text-body/60">
                      {sizeLabel(file.size)}
                    </p>
                  </div>
                  {file.available ? (
                    <a
                      className="shrink-0 rounded border border-highlight-cyan/40 px-4 py-2 text-sm text-highlight-cyan hover:bg-highlight-cyan/10"
                      href={cdnShareUrl(token, file.id)}
                      referrerPolicy="no-referrer"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-sm text-body/50">Unavailable</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-body/45">
              Only download files you were expecting from a sender you trust.
              Contact the sender if a file is unavailable.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
