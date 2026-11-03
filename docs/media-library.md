# Media library and client shares

Open `/dashboard/media` or select **Media** in the panel navigation.

## Private client files

Dashboard uploads are private by default. Drop JPEG, PNG, PDF, or ZIP files up to
50 MB each. Common ZIP MIME aliases and extension fallbacks are handled. Each
upload gets a separate result, so one failure does not discard successful uploads.

Private originals live in S3, under a private namespace whose anonymous reads and listings are checked before upload. The authenticated owner can preview or
download them through the panel. Knowledge of a filename or database ID does not
grant anonymous read access. The panel confirms CDN private-media capability
before sending file bytes, and never sends its CDN key to the browser.

Existing public files are explicitly marked Public. **Make private** moves a
selected legacy file to the private storage area and removes its public origin
copy after confirmation. Moving a website/sponsor asset can break its public links; do this only for files you intend to restrict. Storage-only moves preserve the content revision and existing share links. Previously
cached or downloaded public copies cannot be withdrawn.

## Share selected files with clients

1. Select up to 50 files using **Select for sharing**.
2. Enter a share title and choose 1, 7, or 30 days (default 7).
3. Choose **Create download link**, then copy the client link.

The public `/share/<token>` page lists only the selected files with individual
download buttons and no panel sign-in required. Tokens are cryptographically
random; only their hashes are stored. Copy the link when creating it; management
history retains titles, expiry, status, and file counts rather than bearer tokens.

Open **Manage shared links** to inspect expiry/status and revoke future access.
Expiry, revocation, membership, deletion, and the file revision are checked on
every download. Responses are streamed as attachments with no-store caching.
Deleted/replaced files become unavailable through previous shares. Client pages
are dynamic and excluded from indexing; production downloads require HTTPS.

Anyone with a share link can download until expiry/revocation. Already downloaded
copies cannot be recalled. Sharing an older Public file does not invalidate its
original public permalink; use Make private first for confidential client files.
Share links do not certify file contents as malware-free.

## Panel authorization

Only `pascal@miomideal.com` with the ADMIO role can manage media and shares. Discord
sign-in requires a verified owner email. Protected API calls and private file
reads check the current database account, blocking removed/revoked owner sessions.
Cross-origin browser mutations are rejected before multipart processing.
Set AUTH_URL to the public panel URL when deploying behind a proxy.

Public sponsor checkout in mio_page continues accepting sanitized visitor logos.
Those public files can appear in this same library. Public websites necessarily
expose the images they display; CORS/referrer rules cannot prevent copying those
images. The CDN provides no anonymous file-listing API or directory index.

## Deployment

Deploy CDN main first, then panel main. The CDN migration entrypoint adds
File.isPublic (default true for legacy records), MediaShare, and MediaShareFile.
No panel schema changes or new credentials are needed. Private uploads use S3 exclusively, with local disk used only for temporary processing. The existing S3 connection and bucket are reused when they pass anonymous-access checks. Set S3_PRIVATE_BUCKET to another private bucket if needed; a separate bucket is required when S3_PUBLIC_BASE_URL is configured. Legacy private disk files show Move to S3; migrate those before removing their old volume.

The panel uses existing server-only UPLOAD_URL (such as
https://cdn.example.com/api/upload/) and UPLOAD_KEY matching CDN_API_KEY. Run Node
20.19 or newer. Hosting/proxy request limits must permit the desired upload size;
platforms with a smaller fixed body limit require a direct-upload design later.
Nothing in this change automatically hides or deletes existing website assets.
