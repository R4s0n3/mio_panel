import "server-only";

export const PANEL_OWNER_EMAIL = "pascal@miomideal.com";

/** Authorize the panel owner only when the account also has the administrator role. */
export function isPanelOwner(
  user: { email?: string | null; role?: string | null } | null | undefined,
): boolean {
  return user?.email === PANEL_OWNER_EMAIL && user.role === "ADMIO";
}

/** Trust the email only when it comes from a verified Discord OAuth profile. */
export function isVerifiedOwnerSignIn(
  userEmail: string | null | undefined,
  provider: string | undefined,
  profile: unknown,
): boolean {
  if (
    userEmail !== PANEL_OWNER_EMAIL ||
    provider !== "discord" ||
    typeof profile !== "object" ||
    profile === null
  )
    return false;
  return (
    "email" in profile &&
    profile.email === PANEL_OWNER_EMAIL &&
    "verified" in profile &&
    profile.verified === true
  );
}

/** Reject browser mutations from other origins before processing multipart upload bodies. */
export function isPanelMutationOriginAllowed(
  origin: string | null,
  host: string | null,
  configuredUrl?: string,
): boolean {
  if (origin === null) return true; // Non-browser callers still need the owner's authenticated session.
  try {
    const source = new URL(origin);
    if (
      !["https:", "http:"].includes(source.protocol) ||
      source.origin !== origin
    )
      return false;
    return configuredUrl
      ? source.origin === new URL(configuredUrl).origin
      : source.host === host;
  } catch {
    return false;
  }
}
