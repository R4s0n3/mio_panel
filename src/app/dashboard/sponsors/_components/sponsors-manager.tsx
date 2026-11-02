"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useEffect, useState, type FormEvent } from "react";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { api, type RouterOutputs } from "@/trpc/react";
import {
  fixedBookingTermStatus,
  fixedTermExpiresAt,
  sponsorTermDays,
} from "@/util/sponsor";

type SponsorSlot = RouterOutputs["sponsor"]["getAll"][number];
type SponsorBid = SponsorSlot["bids"][number];
type PricingMode = SponsorSlot["pricingMode"];

const sponsorPlacementOptions = [
  { value: "HERO_BILLBOARD", label: "Hero · large billboard" },
  { value: "PROJECTS_CORNER", label: "Projects · corner card" },
  { value: "PROJECTS_STRIP", label: "Projects · section strip" },
  { value: "ABOUT_SIDECAR", label: "About · side card" },
  { value: "MERCH_BANNER", label: "Merch · wide banner" },
  { value: "FOOTER_STAMP", label: "Footer · small stamp" },
] as const;

type SponsorPlacementValue = (typeof sponsorPlacementOptions)[number]["value"];

function euroToCents(value: FormDataEntryValue | null) {
  const amount = Number.parseFloat(
    typeof value === "string" ? value.replace(",", ".") : "",
  );
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function formString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function formPlacement(form: FormData): SponsorPlacementValue {
  const value = formString(form, "placement");
  const placement = sponsorPlacementOptions.find(
    (option) => option.value === value,
  );
  return placement?.value ?? "HERO_BILLBOARD";
}

function formPricingMode(value: string): PricingMode {
  return value === "FIXED" ? "FIXED" : "AUCTION";
}

function formDurationDays(form: FormData) {
  const raw = formString(form, "durationDays").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function centsToEuro(value: number) {
  return (value / 100).toFixed(2);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read the logo."));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read the logo."));
    reader.readAsDataURL(file);
  });
}

function pricingSummary(slot: SponsorSlot) {
  if (slot.pricingMode === "FIXED") {
    return `Fixed price · ${formatPrice(slot.basePrice)} · ${sponsorTermDays(slot.durationDays)} days`;
  }

  return `Auction · starts at ${formatPrice(slot.basePrice)}`;
}

const fieldClass =
  "w-full rounded-lg border border-body/15 bg-primary-900/70 px-3 py-2 font-text text-sm text-headings outline-none transition focus:border-highlight-cyan";

function TermBadge({ term }: { term: "active" | "expired" }) {
  return (
    <span
      className={`rounded-full px-2 py-1 font-text text-[11px] uppercase ${
        term === "active"
          ? "bg-highlight-green/10 text-highlight-green"
          : "bg-body/10 text-body/40"
      }`}
    >
      {term}
    </span>
  );
}

function BookingTermControls({ bid }: { bid: SponsorBid }) {
  const utils = api.useUtils();
  const [value, setValue] = useState(() =>
    bid.expiresAt ? toDateTimeLocal(bid.expiresAt) : "",
  );
  const updateExpires = api.sponsor.updateExpires.useMutation({
    onSuccess: () => utils.sponsor.getAll.invalidate(),
  });
  const endBooking = api.sponsor.endBooking.useMutation({
    onSuccess: () => utils.sponsor.getAll.invalidate(),
  });
  const term = fixedBookingTermStatus(bid);

  useEffect(() => {
    setValue(bid.expiresAt ? toDateTimeLocal(bid.expiresAt) : "");
  }, [bid.expiresAt]);

  function saveExpires() {
    const expiresAt = fromDateTimeLocal(value);
    if (!expiresAt) return;
    updateExpires.mutate({ bidId: bid.id, expiresAt });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TermBadge term={term} />
      <input
        className={`${fieldClass} max-w-56`}
        onChange={(event) => setValue(event.target.value)}
        type="datetime-local"
        value={value}
      />
      <button
        className="rounded-lg bg-highlight-cyan px-3 py-2 font-subhead text-xs text-primary-900 disabled:opacity-50"
        disabled={updateExpires.isPending || !value}
        onClick={saveExpires}
        type="button"
      >
        {updateExpires.isPending ? "Saving…" : "Save end"}
      </button>
      <button
        className="rounded-lg border border-highlight-magenta/30 px-3 py-2 font-subhead text-xs text-highlight-magenta transition hover:bg-highlight-magenta/10 disabled:opacity-40"
        disabled={endBooking.isPending || term !== "active"}
        onClick={() => endBooking.mutate({ bidId: bid.id })}
        type="button"
      >
        {endBooking.isPending ? "Ending…" : "End now"}
      </button>
      {(updateExpires.error ?? endBooking.error) && (
        <p className="w-full text-xs text-highlight-magenta">
          {(updateExpires.error ?? endBooking.error)?.message}
        </p>
      )}
    </div>
  );
}

function CreateSponsorSpot({
  usedPlacements,
}: {
  usedPlacements: Array<string | null>;
}) {
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [pricingMode, setPricingMode] = useState<PricingMode>("AUCTION");
  const availablePlacements = sponsorPlacementOptions.filter(
    (option) => !usedPlacements.includes(option.value),
  );
  const createSpot = api.sponsor.create.useMutation({
    onSuccess: async () => {
      await utils.sponsor.getAll.invalidate();
      setIsOpen(false);
      setPricingMode("AUCTION");
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createSpot.mutate({
      placement: formPlacement(form),
      name: formString(form, "name"),
      description: formString(form, "description"),
      basePrice: euroToCents(form.get("basePrice")),
      minIncrement: euroToCents(form.get("minIncrement")),
      enabled: true,
      sortOrder: Number(form.get("sortOrder")) || 0,
      pricingMode,
      durationDays: formDurationDays(form),
    });
  }

  if (!isOpen) {
    if (availablePlacements.length === 0) {
      return (
        <div className="rounded-xl border border-body/10 bg-primary-800/35 px-4 py-3 font-text text-xs text-body/40">
          All six homepage placements are configured. Disable a spot to hide it
          without losing its history.
        </div>
      );
    }

    return (
      <button
        className="flex min-h-24 items-center justify-center gap-3 rounded-xl border-2 border-dashed border-highlight-cyan/30 bg-primary-800/50 font-subhead uppercase text-highlight-cyan transition hover:border-highlight-cyan hover:bg-highlight-cyan/5"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <PlusIcon className="size-5" /> Add sponsor spot
      </button>
    );
  }

  return (
    <form
      className="rounded-xl border border-highlight-cyan/25 bg-primary-800/70 p-5"
      onSubmit={handleCreate}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Homepage placement
          <select className={`${fieldClass} mt-1`} name="placement" required>
            {availablePlacements.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Name
          <input
            className={`${fieldClass} mt-1`}
            name="name"
            placeholder="Homepage supporter"
            required
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55">
          Pricing
          <select
            className={`${fieldClass} mt-1`}
            name="pricingMode"
            onChange={(event) =>
              setPricingMode(formPricingMode(event.target.value))
            }
            value={pricingMode}
          >
            <option value="AUCTION">Auction</option>
            <option value="FIXED">Fixed price</option>
          </select>
        </label>
        <label className="font-text text-xs uppercase text-body/55">
          {pricingMode === "FIXED" ? "Fixed price (€)" : "Starting price (€)"}
          <input
            className={`${fieldClass} mt-1`}
            min="1"
            name="basePrice"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55">
          Outbid step (€)
          <input
            className={`${fieldClass} mt-1`}
            min="1"
            name="minIncrement"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55">
          Duration (days)
          <input
            className={`${fieldClass} mt-1`}
            min="1"
            name="durationDays"
            placeholder={
              pricingMode === "FIXED" ? "30" : "Auction spots skip this"
            }
            required={pricingMode === "FIXED"}
            type="number"
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55">
          Position
          <input
            className={`${fieldClass} mt-1`}
            defaultValue="40"
            name="sortOrder"
            type="number"
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55 md:col-span-2 xl:col-span-4">
          Description
          <input
            className={`${fieldClass} mt-1`}
            name="description"
            placeholder="Short public description"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="flex-1 rounded-lg bg-highlight-cyan px-4 py-2 font-subhead text-primary-900 disabled:opacity-50"
            disabled={createSpot.isPending}
            type="submit"
          >
            Create
          </button>
          <button
            className="rounded-lg border border-body/15 px-4 py-2 font-subhead text-body/60"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
      {createSpot.error && (
        <p className="mt-3 text-sm text-highlight-magenta">
          {createSpot.error.message}
        </p>
      )}
    </form>
  );
}

function CreateSponsorBooking({ slots }: { slots: SponsorSlot[] }) {
  const utils = api.useUtils();
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [expiresValue, setExpiresValue] = useState("");
  const [expiresTouched, setExpiresTouched] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const selected = slots.find((slot) => slot.id === slotId) ?? slots[0];
  const createBooking = api.sponsor.createBooking.useMutation({
    onSuccess: async () => {
      await utils.sponsor.getAll.invalidate();
      setLogo(null);
      setExpiresTouched(false);
      setFormKey((key) => key + 1);
    },
  });

  useEffect(() => {
    if (!logo) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(logo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  useEffect(() => {
    if (expiresTouched || !selected) return;
    if (selected.pricingMode !== "FIXED") {
      setExpiresValue("");
      return;
    }

    setExpiresValue(
      toDateTimeLocal(fixedTermExpiresAt(new Date(), selected.durationDays)),
    );
  }, [expiresTouched, selected]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !logo) return;

    const form = new FormData(event.currentTarget);
    setLocalError(null);
    try {
      const data = await readFileAsDataUrl(logo);
      createBooking.mutate({
        slotId: selected.id,
        advertiserName: formString(form, "advertiserName"),
        advertiserEmail: formString(form, "advertiserEmail"),
        websiteUrl: formString(form, "websiteUrl"),
        expiresAt:
          selected.pricingMode === "FIXED"
            ? fromDateTimeLocal(expiresValue)
            : null,
        logo: { name: logo.name, data },
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Could not read the logo.",
      );
    }
  }

  if (!selected) return null;

  return (
    <form
      className="rounded-xl border border-highlight-cyan/25 bg-primary-800/70 p-5"
      key={formKey}
      onSubmit={handleCreate}
    >
      <div className="mb-4">
        <p className="font-subhead text-xs uppercase tracking-[0.2em] text-highlight-magenta">
          Manual booking
        </p>
        <p className="mt-1 font-text text-xs text-body/40">
          {selected.pricingMode === "FIXED"
            ? `Books ${selected.name} at ${formatPrice(selected.basePrice)} until the end date. That defaults to ${sponsorTermDays(selected.durationDays)} days from now.`
            : `Places a sponsor on the ${selected.name} auction at ${formatPrice(selected.basePrice)}.`}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Spot
          <select
            className={`${fieldClass} mt-1`}
            name="slotId"
            onChange={(event) => {
              setSlotId(event.target.value);
              setExpiresTouched(false);
            }}
            value={selected.id}
          >
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.name} ·{" "}
                {slot.pricingMode === "FIXED" ? "Fixed" : "Auction"}
              </option>
            ))}
          </select>
        </label>
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Brand name
          <input
            className={`${fieldClass} mt-1`}
            name="advertiserName"
            placeholder="Brand"
            required
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Contact email
          <input
            className={`${fieldClass} mt-1`}
            name="advertiserEmail"
            required
            type="email"
          />
        </label>
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Target URL
          <input
            className={`${fieldClass} mt-1`}
            name="websiteUrl"
            placeholder="https://"
            required
            type="url"
          />
        </label>
        {selected.pricingMode === "FIXED" && (
          <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
            Ends
            <input
              className={`${fieldClass} mt-1`}
              onChange={(event) => {
                setExpiresTouched(true);
                setExpiresValue(event.target.value);
              }}
              required
              type="datetime-local"
              value={expiresValue}
            />
          </label>
        )}
        <label className="font-text text-xs uppercase text-body/55 xl:col-span-2">
          Logo
          <input
            accept="image/png,image/jpeg,image/gif,image/webp"
            className={`${fieldClass} mt-1 file:mr-3 file:rounded file:border-0 file:bg-highlight-cyan/15 file:px-2 file:py-1 file:font-subhead file:text-xs file:text-highlight-cyan`}
            onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
            required
            type="file"
          />
        </label>
        <div className="flex items-end gap-3 xl:col-span-2">
          {previewUrl && (
            <div className="flex h-11 w-24 items-center justify-center rounded-lg border border-body/10 bg-primary-900/70 p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="max-h-full max-w-full object-contain"
                src={previewUrl}
              />
            </div>
          )}
          <button
            className="flex-1 rounded-lg bg-highlight-cyan px-4 py-2 font-subhead text-primary-900 disabled:opacity-50"
            disabled={createBooking.isPending || !logo}
            type="submit"
          >
            {createBooking.isPending ? "Booking…" : "Create booking"}
          </button>
        </div>
      </div>
      {(localError ?? createBooking.error?.message) && (
        <p className="mt-3 text-sm text-highlight-magenta">
          {localError ?? createBooking.error?.message}
        </p>
      )}
    </form>
  );
}

function SponsorSlotCard({ slot }: { slot: SponsorSlot }) {
  const utils = api.useUtils();
  const [pricingMode, setPricingMode] = useState<PricingMode>(slot.pricingMode);
  const updateSpot = api.sponsor.update.useMutation({
    onSuccess: () => utils.sponsor.getAll.invalidate(),
  });
  const removeCurrent = api.sponsor.removeCurrent.useMutation({
    onSuccess: () => utils.sponsor.getAll.invalidate(),
  });

  useEffect(() => {
    setPricingMode(slot.pricingMode);
  }, [slot.pricingMode]);

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateSpot.mutate({
      id: slot.id,
      placement: formPlacement(form),
      name: formString(form, "name"),
      description: formString(form, "description"),
      basePrice: euroToCents(form.get("basePrice")),
      minIncrement: euroToCents(form.get("minIncrement")),
      enabled: form.get("enabled") === "on",
      sortOrder: Number(form.get("sortOrder")) || 0,
      pricingMode,
      durationDays: formDurationDays(form),
    });
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-body/10 bg-primary-800/80 shadow-xl">
      <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-body/10 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="font-subhead text-xs uppercase tracking-[0.2em] text-highlight-cyan">
              Current creative
            </p>
            <span
              className={`rounded-full px-2.5 py-1 font-text text-[11px] uppercase ${
                slot.enabled
                  ? "bg-highlight-green/10 text-highlight-green"
                  : "bg-body/10 text-body/40"
              }`}
            >
              {slot.enabled ? "Public" : "Hidden"}
            </span>
          </div>
          <p className="mt-2 font-text text-[11px] uppercase tracking-wide text-body/45">
            {pricingSummary(slot)}
          </p>

          <div className="mt-4 flex min-h-44 items-center justify-center rounded-xl border border-dashed border-body/15 bg-primary-900/60 p-5">
            {slot.currentBid ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${slot.currentBid.advertiserName} logo`}
                className="max-h-28 max-w-[85%] object-contain"
                src={slot.currentBid.logoUrl}
              />
            ) : (
              <p className="font-subhead text-sm uppercase text-body/25">
                Empty spot
              </p>
            )}
          </div>

          {slot.currentBid ? (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-subhead text-xl">
                    {slot.currentBid.advertiserName}
                  </p>
                  <a
                    className="block truncate font-text text-xs text-highlight-cyan/70 hover:underline"
                    href={slot.currentBid.websiteUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {slot.currentBid.websiteUrl}
                  </a>
                  <p className="mt-2 font-subhead text-sm text-highlight-green">
                    {formatPrice(slot.currentBid.amount)} paid
                  </p>
                  {slot.pricingMode === "FIXED" && (
                    <p className="mt-1 font-text text-xs text-body/45">
                      {slot.currentBid.expiresAt
                        ? `Ends ${formatDate(slot.currentBid.expiresAt)}`
                        : "No end date yet"}
                    </p>
                  )}
                </div>
                <button
                  className="rounded-lg border border-highlight-magenta/30 p-2 text-highlight-magenta transition hover:bg-highlight-magenta/10 disabled:opacity-40"
                  disabled={removeCurrent.isPending}
                  onClick={() => removeCurrent.mutate({ slotId: slot.id })}
                  title="Remove current sponsor"
                  type="button"
                >
                  <TrashIcon className="size-5" />
                </button>
              </div>
              {slot.pricingMode === "FIXED" && (
                <div className="mt-4">
                  <BookingTermControls bid={slot.currentBid} />
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 font-text text-sm text-body/35">
              No sponsor owns this placement yet.
            </p>
          )}
        </div>

        <form className="p-5" onSubmit={handleUpdate}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-subhead text-xs uppercase tracking-[0.2em] text-highlight-magenta">
                Spot settings
              </p>
              <p className="mt-1 font-text text-xs text-body/35">
                {slot._count.bids}{" "}
                {slot.pricingMode === "FIXED" ? "booking" : "checkout"}
                {slot._count.bids === 1 ? "" : "s"} created
              </p>
            </div>
            <label className="flex items-center gap-2 font-text text-xs uppercase text-body/55">
              <input
                className="size-4 accent-highlight-cyan"
                defaultChecked={slot.enabled}
                name="enabled"
                type="checkbox"
              />
              Enabled
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-text text-xs uppercase text-body/55 sm:col-span-2">
              Homepage placement
              <select
                className={`${fieldClass} mt-1`}
                defaultValue={slot.placement ?? ""}
                name="placement"
                required
              >
                {!slot.placement && (
                  <option value="">Choose a placement</option>
                )}
                {sponsorPlacementOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-text text-xs uppercase text-body/55">
              Pricing
              <select
                className={`${fieldClass} mt-1`}
                name="pricingMode"
                onChange={(event) =>
                  setPricingMode(formPricingMode(event.target.value))
                }
                value={pricingMode}
              >
                <option value="AUCTION">Auction</option>
                <option value="FIXED">Fixed price</option>
              </select>
            </label>
            <label className="font-text text-xs uppercase text-body/55">
              Duration (days)
              <input
                className={`${fieldClass} mt-1`}
                defaultValue={slot.durationDays ?? ""}
                key={`${slot.id}-${slot.durationDays ?? "none"}`}
                min="1"
                name="durationDays"
                placeholder={
                  pricingMode === "FIXED" ? "30" : "Not used for auctions"
                }
                required={pricingMode === "FIXED"}
                type="number"
              />
            </label>
            <label className="font-text text-xs uppercase text-body/55 sm:col-span-2">
              Name
              <input
                className={`${fieldClass} mt-1`}
                defaultValue={slot.name}
                name="name"
                required
              />
            </label>
            <label className="font-text text-xs uppercase text-body/55 sm:col-span-2">
              Description
              <input
                className={`${fieldClass} mt-1`}
                defaultValue={slot.description ?? ""}
                name="description"
              />
            </label>
            <label className="font-text text-xs uppercase text-body/55">
              {pricingMode === "FIXED"
                ? "Fixed price (€)"
                : "Starting price (€)"}
              <input
                className={`${fieldClass} mt-1`}
                defaultValue={centsToEuro(slot.basePrice)}
                min="1"
                name="basePrice"
                required
                step="0.01"
                type="number"
              />
            </label>
            <label className="font-text text-xs uppercase text-body/55">
              Outbid step (€)
              <input
                className={`${fieldClass} mt-1`}
                defaultValue={centsToEuro(slot.minIncrement)}
                min="1"
                name="minIncrement"
                required
                step="0.01"
                type="number"
              />
            </label>
            <label className="font-text text-xs uppercase text-body/55">
              Sort position
              <input
                className={`${fieldClass} mt-1`}
                defaultValue={slot.sortOrder}
                name="sortOrder"
                type="number"
              />
            </label>
            <div className="flex items-end">
              <button
                className="w-full rounded-lg bg-highlight-cyan px-4 py-2 font-subhead text-primary-900 transition hover:bg-highlight-green disabled:opacity-50"
                disabled={updateSpot.isPending}
                type="submit"
              >
                {updateSpot.isPending ? "Saving…" : "Save spot"}
              </button>
            </div>
          </div>
          {(updateSpot.error ?? removeCurrent.error) && (
            <p className="mt-3 text-sm text-highlight-magenta">
              {(updateSpot.error ?? removeCurrent.error)?.message}
            </p>
          )}
        </form>
      </div>

      {slot.bids.length > 0 && (
        <details className="border-t border-body/10 bg-primary-900/35">
          <summary className="cursor-pointer px-5 py-3 font-subhead text-xs uppercase tracking-[0.16em] text-body/50 transition hover:text-highlight-cyan">
            {slot.pricingMode === "FIXED"
              ? "Recent bookings"
              : "Recent bid history"}
          </summary>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[680px] text-left font-text text-xs">
              <thead className="text-body/35">
                <tr>
                  <th className="py-2 font-normal">Sponsor</th>
                  <th className="py-2 font-normal">Email</th>
                  <th className="py-2 font-normal">Amount</th>
                  <th className="py-2 font-normal">Status</th>
                  {slot.pricingMode === "FIXED" && (
                    <th className="py-2 font-normal">Ends</th>
                  )}
                  <th className="py-2 text-right font-normal">Created</th>
                </tr>
              </thead>
              <tbody>
                {slot.bids.map((bid) => (
                  <tr
                    className="border-t border-body/10 text-body/70"
                    key={bid.id}
                  >
                    <td className="py-2.5 align-top font-medium text-headings">
                      {bid.advertiserName}
                    </td>
                    <td className="py-2.5 align-top">{bid.advertiserEmail}</td>
                    <td className="py-2.5 align-top">
                      {formatPrice(bid.amount)}
                    </td>
                    <td className="py-2.5 align-top">
                      {slot.pricingMode === "FIXED" ? (
                        <span className="flex flex-col items-start gap-1">
                          <TermBadge term={fixedBookingTermStatus(bid)} />
                          <span className="uppercase text-body/35">
                            {bid.status}
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-200/60 px-2 py-1 uppercase">
                          {bid.status}
                        </span>
                      )}
                    </td>
                    {slot.pricingMode === "FIXED" && (
                      <td className="min-w-72 py-2.5 align-top">
                        {bid.id === slot.currentBid?.id ? (
                          <span className="text-body/55">
                            {bid.expiresAt ? formatDate(bid.expiresAt) : "—"}
                          </span>
                        ) : (
                          <BookingTermControls bid={bid} />
                        )}
                      </td>
                    )}
                    <td className="py-2.5 text-right align-top text-body/40">
                      {formatDate(bid.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </article>
  );
}

export default function SponsorsManager() {
  const [slots] = api.sponsor.getAll.useSuspenseQuery();

  if (!slots) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <CreateSponsorSpot usedPlacements={slots.map((slot) => slot.placement)} />
      <CreateSponsorBooking slots={slots} />
      {slots.map((slot) => (
        <SponsorSlotCard key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
