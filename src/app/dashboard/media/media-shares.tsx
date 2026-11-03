"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/trpc/react";

type SelectedFile = { id: string; name: string };
const buttonClass =
  "rounded border border-highlight-cyan/30 px-3 py-2 text-sm text-highlight-cyan hover:bg-highlight-cyan/10 disabled:opacity-40";

export function MediaShares({
  selectedFiles,
  onClear,
  onRemove,
}: {
  selectedFiles: SelectedFile[];
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<1 | 7 | 30>(7);
  const [page, setPage] = useState(0);
  const [link, setLink] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [feedback, setFeedback] = useState("");
  const shares = api.storage.listShares.useQuery({ page });
  const create = api.storage.createShare.useMutation();
  const revoke = api.storage.revokeShare.useMutation();
  const utils = api.useUtils();
  async function createLink(): Promise<void> {
    setFeedback("");
    try {
      const result = await create.mutateAsync({
        title: title.trim() || "Shared files",
        expiresInDays: days,
        fileIds: selectedFiles.map((file) => file.id),
      });
      setCreatedId(result.id);
      setLink(
        new URL(`/share/${result.token}`, window.location.origin).toString(),
      );
      setFeedback("Share link created. Copy it below to send to your client.");
      onClear();
      setPage(0);
      await utils.storage.listShares.invalidate();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not create a share.",
      );
    }
  }
  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(link);
      setFeedback("Share link copied.");
    } catch {
      setFeedback("Select and copy the link below.");
    }
  }
  async function revokeLink(id: string): Promise<void> {
    try {
      await revoke.mutateAsync({ id });
      if (id === createdId) setLink("");
      await utils.storage.listShares.invalidate();
      setFeedback(
        "Share revoked. Future downloads through that link are blocked.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not revoke this share.",
      );
    }
  }
  return (
    <section
      className="space-y-4 rounded-xl border border-highlight-cyan/20 bg-surface/40 p-5"
      aria-label="Share media"
    >
      <div>
        <h2 className="font-subhead text-xl">Share media</h2>
        <p className="mt-1 text-sm text-body/60">
          Select up to 50 files below and create a download page for your
          client.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedFiles.map((file) => (
          <button
            key={file.id}
            type="button"
            className="max-w-full rounded border border-body/15 px-2 py-1 text-xs text-body/70"
            onClick={() => onRemove(file.id)}
            aria-label={`Remove ${file.name} from share`}
          >
            <span className="break-all">{file.name} ×</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-body/70">
          Share title
          <input
            className="rounded border border-body/20 bg-surface px-3 py-2 text-headings"
            maxLength={120}
            value={title}
            placeholder="Client project files"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body/70">
          Expires after
          <select
            className="rounded border border-body/20 bg-surface px-3 py-2 text-headings"
            value={days}
            onChange={(event) =>
              setDays(Number(event.target.value) as 1 | 7 | 30)
            }
          >
            <option value={1}>1 day</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={selectedFiles.length === 0 || create.isPending}
          onClick={() => void createLink()}
        >
          {create.isPending
            ? "Creating…"
            : `Create download link (${selectedFiles.length})`}
        </button>
      </div>
      <p className="text-xs text-body/50">
        Private files can be downloaded through your dashboard or an active
        share link. Anyone with that link can download until expiry or
        revocation. Older public files keep their public permalinks.
      </p>
      {link && (
        <div className="flex flex-wrap gap-2">
          <input
            readOnly
            aria-label="Client share link"
            className="min-w-0 flex-1 rounded border border-highlight-cyan/30 bg-primary-900/50 p-2 text-sm"
            value={link}
            onFocus={(event) => event.target.select()}
          />
          <button
            type="button"
            className={buttonClass}
            onClick={() => void copyLink()}
          >
            Copy share link
          </button>
          <a
            className={buttonClass}
            href={link}
            target="_blank"
            rel="noreferrer"
          >
            Open share
          </a>
        </div>
      )}
      {feedback && (
        <p role="status" className="text-sm text-highlight-cyan">
          {feedback}
        </p>
      )}
      <details>
        <summary className="cursor-pointer font-subhead text-sm">
          Manage shared links
        </summary>
        <div className="mt-4 space-y-3">
          {shares.isPending ? (
            <p>Loading shares…</p>
          ) : shares.error ? (
            <p role="alert" className="text-sm text-highlight-magenta">
              {shares.error.message}
            </p>
          ) : shares.data.shares.length === 0 ? (
            <p className="text-sm text-body/60">No shared links yet.</p>
          ) : (
            shares.data.shares.map((share) => {
              const expired = new Date(share.expiresAt).getTime() <= Date.now();
              return (
                <div
                  key={share.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-body/10 py-3"
                >
                  <div>
                    <h3 className="break-words text-sm">{share.title}</h3>
                    <p className="text-xs text-body/50">
                      {share.fileCount} files ·{" "}
                      {share.revokedAt
                        ? "Revoked"
                        : expired
                          ? "Expired"
                          : `Expires ${new Date(share.expiresAt).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={
                      Boolean(share.revokedAt) || expired || revoke.isPending
                    }
                    onClick={() => void revokeLink(share.id)}
                  >
                    Revoke link
                  </button>
                </div>
              );
            })
          )}
          {shares.data && shares.data.total > 20 && (
            <nav
              className="flex items-center gap-3"
              aria-label="Shared link pages"
            >
              <button
                type="button"
                className={buttonClass}
                disabled={page === 0 || shares.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-xs">Page {page + 1}</span>
              <button
                type="button"
                className={buttonClass}
                disabled={
                  (page + 1) * 20 >= shares.data.total || shares.isFetching
                }
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </details>
    </section>
  );
}

export function MakePrivateDialog({
  name,
  busy,
  error,
  onCancel,
  onConfirm,
  migrateOnly = false,
}: {
  name: string;
  migrateOnly?: boolean;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="fixed inset-0 m-0 flex h-screen max-h-none w-screen max-w-none items-center justify-center bg-transparent p-4 text-headings backdrop:bg-primary-900/90"
      aria-labelledby="private-file-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-highlight-cyan/30 bg-surface p-6">
        <h2 id="private-file-title" className="font-subhead text-xl">
          {migrateOnly ? "Move this file to S3?" : "Make this file private?"}
        </h2>
        <p className="break-words text-sm">{name}</p>
        <p className="text-sm text-body/60">
          {migrateOnly
            ? "Moves the existing private disk copy into verified private S3 storage. Existing share links keep working."
            : "Its public origin link will stop working. Moving website or sponsor images can break those pages. The file will be stored in private S3 storage."}
        </p>
        <p className="text-xs text-body/50">
          Previously cached or downloaded copies cannot be withdrawn.
        </p>
        <div className="flex justify-end gap-3">
          <button
            autoFocus
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Moving…" : migrateOnly ? "Move to S3" : "Make private"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-highlight-magenta">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
