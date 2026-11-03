"use client";

import { mediaFileMimeType } from "@/util/media-files";

import Image from "next/image";
import { MediaShares, MakePrivateDialog } from "./media-shares";
import { useEffect, useRef, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";

type StoredFile = RouterOutputs["storage"]["list"]["files"][number];
type UploadResult = {
  name: string;
  status: string;
  url?: string;
  isPublic?: boolean;
  error?: boolean;
};
const buttonClass =
  "rounded border border-highlight-cyan/30 px-3 py-2 text-sm text-highlight-cyan hover:bg-highlight-cyan/10 disabled:opacity-40";
function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaManager() {
  const [selected, setSelected] = useState<
    Map<string, { id: string; name: string }>
  >(new Map());
  function toggleSelection(file: StoredFile): void {
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(file.id)) next.delete(file.id);
      else if (next.size < 50)
        next.set(file.id, {
          id: file.id,
          name: file.originalName ?? file.fileName ?? "Untitled file",
        });
      return next;
    });
  }
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [message, setMessage] = useState("");
  const [privacyFile, setPrivacyFile] = useState<StoredFile | null>(null);
  const makePrivate = api.storage.makePrivate.useMutation();
  async function moveToPrivate(): Promise<void> {
    if (!privacyFile) return;
    try {
      await makePrivate.mutateAsync({ id: privacyFile.id });
      setPrivacyFile(null);
      await utils.storage.list.invalidate();
      setMessage(
        "File is now private. Create a new share link for your client.",
      );
    } catch {
      /* Mutation error is shown in the confirmation dialog. */
    }
  }
  const [deleting, setDeleting] = useState<StoredFile | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (deleting && !dialog.current?.open) dialog.current?.showModal();
  }, [deleting]);
  const uploadLock = useRef(false);
  const utils = api.useUtils();
  const files = api.storage.list.useQuery({ search, page });
  const upload = api.storage.upload.useMutation();
  const remove = api.storage.delete.useMutation();

  async function copy(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Permalink copied.");
    } catch {
      setMessage("Could not copy. Open the file and copy its address.");
    }
  }
  async function uploadFiles(selected: File[]): Promise<void> {
    if (uploadLock.current || selected.length === 0) return;
    uploadLock.current = true;
    setUploading(true);
    setMessage("");
    const queue: UploadResult[] = selected.map((file) => ({
      name: file.name,
      status: "Queued",
    }));
    setResults([...queue]);
    try {
      for (const [index, file] of selected.entries()) {
        queue[index] = { name: file.name, status: "Uploading…" };
        setResults([...queue]);
        try {
          if (
            !mediaFileMimeType(file) ||
            file.size === 0 ||
            file.size > 50 * 1024 * 1024
          ) {
            throw new Error(
              "Use a JPEG, PNG, PDF, or ZIP between 1 byte and 50 MB.",
            );
          }
          const form = new FormData();
          form.set("file", file);
          const uploaded = await upload.mutateAsync(form);
          const result = uploaded[0];
          if (!result) throw new Error("CDN returned no file.");
          queue[index] = {
            name: file.name,
            status: "Uploaded",
            url: result.url,
            isPublic: result.isPublic,
          };
        } catch (error) {
          queue[index] = {
            name: file.name,
            status: error instanceof Error ? error.message : "Upload failed",
            error: true,
          };
        }
        setResults([...queue]);
      }
      await utils.storage.list.invalidate();
    } finally {
      uploadLock.current = false;
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  async function deleteFile(): Promise<void> {
    if (!deleting) return;
    try {
      await remove.mutateAsync({ id: deleting.id });
      setDeleting(null);
      setSelected((previous) => {
        const next = new Map(previous);
        next.delete(deleting.id);
        return next;
      });
      setMessage(
        "File deleted. Previously cached copies may remain available until they expire.",
      );
      if (files.data?.files.length === 1 && page > 0) setPage(page - 1);
      await utils.storage.list.invalidate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <>
      <section
        className={`rounded-xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-highlight-cyan bg-highlight-cyan/10" : "border-highlight-cyan/30 bg-surface/40"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadFiles(Array.from(event.dataTransfer.files));
        }}
        aria-busy={uploading}
      >
        <h2 className="font-subhead text-xl">Drop files here</h2>
        <p className="my-3 text-sm text-body/60">
          JPEG, PNG, PDF, or ZIP · Up to 50 MB per file · Private client files
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf,.zip,application/zip,application/x-zip-compressed"
          className="hidden"
          aria-label="Choose media files"
          disabled={uploading}
          onChange={(event) =>
            void uploadFiles(Array.from(event.target.files ?? []))
          }
        />
        <button
          type="button"
          className={buttonClass}
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? "Uploading files…" : "Browse files"}
        </button>
      </section>
      {results.length > 0 && (
        <section
          aria-label="Upload results"
          aria-live="polite"
          className="space-y-2 rounded-lg bg-surface/50 p-4"
        >
          {results.map((result, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-body/10 py-2"
            >
              <div className="min-w-0">
                <p className="break-all text-sm">{result.name}</p>
                <p
                  className={`text-xs ${result.error ? "text-highlight-magenta" : "text-body/60"}`}
                >
                  {result.status}
                </p>
              </div>
              {result.url && (
                <div className="flex gap-2">
                  <a
                    className={buttonClass}
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open file
                  </a>
                  {result.isPublic !== false ? (
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => void copy(result.url!)}
                    >
                      Copy permalink
                    </button>
                  ) : (
                    <span className="text-xs text-body/60">
                      Private · Select below to create a client share
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
      <p role="status" className="text-sm text-highlight-cyan">
        {message}
      </p>
      <MediaShares
        selectedFiles={[...selected.values()]}
        onClear={() => setSelected(new Map())}
        onRemove={(id) =>
          setSelected((previous) => {
            const next = new Map(previous);
            next.delete(id);
            return next;
          })
        }
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-2 text-sm text-body/70">
          Search files
          <input
            type="search"
            value={search}
            maxLength={200}
            placeholder="Search by filename…"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            className="rounded border border-body/20 bg-surface px-3 py-2 text-headings"
          />
        </label>
        <div className="flex items-center gap-3 text-sm text-body/60">
          <span>{files.data?.total ?? 0} files</span>
          <button
            type="button"
            className={buttonClass}
            disabled={files.isFetching}
            onClick={() => void files.refetch()}
          >
            Refresh
          </button>
        </div>
      </div>
      {files.isPending ? (
        <p role="status">Loading media…</p>
      ) : files.error ? (
        <p role="alert" className="text-highlight-magenta">
          {files.error.message}
        </p>
      ) : files.data.files.length === 0 ? (
        <p className="rounded-lg border border-body/10 p-10 text-center text-body/60">
          {search
            ? "No files match your search."
            : "Your library is empty. Upload your first file above."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.data.files.map((file) => (
            <article
              key={file.id}
              className="overflow-hidden rounded-xl border border-body/10 bg-surface/50"
            >
              <div className="relative flex h-44 items-center justify-center bg-primary-900/50">
                {file.mimeType.startsWith("image/") &&
                (file.isPublic ||
                  [
                    "image/png",
                    "image/jpeg",
                    "image/gif",
                    "image/webp",
                  ].includes(file.mimeType)) ? (
                  <Image
                    unoptimized
                    src={file.isPublic ? file.url : `${file.url}?preview=1`}
                    alt={file.originalName ?? "Uploaded image"}
                    fill
                    className="object-contain p-3"
                  />
                ) : (
                  <span className="font-subhead text-3xl text-body/40">
                    {file.mimeType === "application/pdf"
                      ? "PDF"
                      : file.mimeType.includes("zip")
                        ? "ZIP"
                        : "FILE"}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <label className="flex items-center gap-2 text-sm text-body/70">
                  <input
                    type="checkbox"
                    checked={selected.has(file.id)}
                    disabled={!selected.has(file.id) && selected.size >= 50}
                    onChange={() => toggleSelection(file)}
                  />{" "}
                  Select for sharing
                </label>
                <h2
                  className="truncate font-subhead"
                  title={file.originalName ?? file.fileName ?? file.id}
                >
                  {file.originalName ?? file.fileName ?? "Untitled file"}
                </h2>
                <p className="text-xs text-body/50">
                  {file.isPublic ? "Public" : "Private"} ·{" "}
                  {sizeLabel(file.size)} ·{" "}
                  {new Date(file.createdAt).toLocaleDateString()} ·{" "}
                  {file.mimeType}
                </p>
                <input
                  aria-label={
                    file.isPublic
                      ? `Public permalink for ${file.originalName ?? "file"}`
                      : "Private client file"
                  }
                  readOnly
                  value={
                    file.isPublic
                      ? file.url
                      : "Private — create a share link for clients"
                  }
                  onFocus={(event) => event.target.select()}
                  className="w-full rounded border border-body/10 bg-primary-900/50 p-2 text-xs text-body/60"
                />
                <div className="flex flex-wrap gap-2">
                  {file.isPublic && (
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => void copy(file.url)}
                    >
                      Copy permalink
                    </button>
                  )}
                  <a
                    className={buttonClass}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open file
                  </a>
                  {file.isPublic && (
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => {
                        makePrivate.reset();
                        setPrivacyFile(file);
                      }}
                    >
                      Make private
                    </button>
                  )}
                  <button
                    type="button"
                    className="ml-auto px-2 text-sm text-highlight-magenta"
                    onClick={() => setDeleting(file)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {files.data && files.data.total > 24 && (
        <nav
          aria-label="Media pages"
          className="flex items-center justify-center gap-4"
        >
          <button
            type="button"
            className={buttonClass}
            disabled={page === 0 || files.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {page + 1} of {Math.ceil(files.data.total / 24)}
          </span>
          <button
            type="button"
            className={buttonClass}
            disabled={(page + 1) * 24 >= files.data.total || files.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
      {privacyFile && (
        <MakePrivateDialog
          name={privacyFile.originalName ?? privacyFile.fileName ?? "File"}
          busy={makePrivate.isPending}
          error={makePrivate.error?.message}
          onCancel={() => setPrivacyFile(null)}
          onConfirm={() => void moveToPrivate()}
        />
      )}
      {deleting && (
        <dialog
          ref={dialog}
          className="fixed inset-0 m-0 flex h-screen max-h-none w-screen max-w-none items-center justify-center bg-transparent p-4 text-headings backdrop:bg-primary-900/90"
          aria-modal="true"
          aria-labelledby="delete-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!remove.isPending) setDeleting(null);
          }}
        >
          <div className="w-full max-w-md space-y-4 rounded-xl border border-highlight-magenta/30 bg-surface p-6">
            <h2 id="delete-title" className="font-subhead text-xl">
              Delete this file?
            </h2>
            <p className="break-words text-sm text-body/70">
              {deleting.originalName ?? deleting.fileName}
            </p>
            <p className="text-sm text-body/60">
              This permanently removes the stored file. Links used on your site
              may break. Cached copies may remain available until they expire.
            </p>
            <div className="flex justify-end gap-3">
              <button
                autoFocus
                type="button"
                className={buttonClass}
                disabled={remove.isPending}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={remove.isPending}
                onClick={() => void deleteFile()}
              >
                {remove.isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
            {remove.error && (
              <p role="alert" className="text-sm text-highlight-magenta">
                {remove.error.message}
              </p>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
