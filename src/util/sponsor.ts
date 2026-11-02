export const DEFAULT_SPONSOR_TERM_DAYS = 30;

export function sponsorTermDays(durationDays: number | null | undefined) {
  return durationDays && durationDays > 0
    ? durationDays
    : DEFAULT_SPONSOR_TERM_DAYS;
}

export function fixedTermExpiresAt(
  from: Date,
  durationDays: number | null | undefined,
) {
  const days = sponsorTermDays(durationDays);
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function fixedBookingTermStatus(
  bid: {
    status: string;
    expiresAt: Date | null;
  },
  now = new Date(),
): "active" | "expired" {
  if (
    bid.status === "ACTIVE" &&
    bid.expiresAt &&
    bid.expiresAt.getTime() > now.getTime()
  ) {
    return "active";
  }

  return "expired";
}
