# Media library

Open `/dashboard/media` or select **Media** in the panel navigation. An authorized
panel administrator can drop several files, browse the library, search filenames,
copy public CDN links, open files, and permanently delete files after confirmation.
Each upload has its own result; a failure does not discard successful uploads.

## Configuration and deployment

The existing server variables `UPLOAD_URL` and `UPLOAD_KEY` are used. `UPLOAD_URL`
should point to the CDN upload base, such as `https://cdn.example.com/api/upload/`.
No API key is sent to the browser. No panel schema migration is needed for media.
Deploy the CDN's authenticated `/api/upload/files` endpoints with this panel change.
The API lists active file metadata owned by this API key, including previous uploads.
Files placed directly in the bucket without CDN metadata do not appear.

Multipart uploads go through an authenticated tRPC mutation, then the panel server
forwards the original file to the CDN. JPEG, PNG, PDF, and ZIP are supported, up to 50 MB
per file. Hosting/proxy request limits must also allow the desired upload size;
platforms with a smaller fixed request limit require a future direct-upload flow.
The panel API uses Node's File/FormData APIs, so run Node 20 or newer.

Deletion removes the object before marking its metadata deleted, allowing retries
if storage is unavailable. Public caches may retain copies until they expire.
Product and sponsor records referencing a deleted URL are not modified.

## Repository synchronization

`origin/main` was fetched for all four repositories. The panel, public page, and
media center were updated while preserving their existing local changes. Conflicts
were resolved to retain local invoice metadata, responsive cart changes, and the
media center's newer dependency versions.

The CDN's fetched `origin/main` introduces PostgreSQL, local disk storage, and an
environment API key. Existing uncommitted work instead implements S3 storage with
MySQL and database-owned API keys. The active CDN work retains that S3 setup;
upstream CDN synchronization is pending a deliberate storage/database migration.
The media endpoints in this change target the existing local S3 implementation.
Backup stashes named `codex-before-media-sync` remain in repositories where needed.


## Panel access

Only `pascal@miomideal.com` with the `ADMIO` role can use protected panel APIs,
including media upload, listing, deletion, the older product-image upload, and
panel sponsor management. Each protected call checks the current database account,
so deleting the account or revoking its role blocks an existing session as well.
Discord sign-in requires the same owner email and a verified OAuth email profile.
Cross-origin browser mutations are rejected before multipart uploads are processed.
Set `AUTH_URL` to the public panel URL when deploying behind a proxy.

The CDN key is used only on the server. Public sponsor checkout on `mio_page`
continues accepting visitor logos as requested; those files can appear in the same
CDN media library. This panel restriction does not disable that separate workflow.
