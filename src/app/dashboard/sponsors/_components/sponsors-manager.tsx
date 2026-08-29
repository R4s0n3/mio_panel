"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useState, type FormEvent } from "react";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { api, type RouterOutputs } from "@/trpc/react";

type SponsorSlot = RouterOutputs["sponsor"]["getAll"][number];

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

const fieldClass =
  "w-full rounded-lg border border-body/15 bg-primary-900/70 px-3 py-2 font-text text-sm text-headings outline-none transition focus:border-highlight-cyan";

function CreateSponsorSpot({
  usedPlacements,
}: {
  usedPlacements: Array<string | null>;
}) {
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const availablePlacements = sponsorPlacementOptions.filter(
    (option) => !usedPlacements.includes(option.value),
  );
  const createSpot = api.sponsor.create.useMutation({
    onSuccess: async () => {
      await utils.sponsor.getAll.invalidate();
      setIsOpen(false);
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
          Starting price (€)
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

function SponsorSlotCard({ slot }: { slot: SponsorSlot }) {
  const utils = api.useUtils();
  const updateSpot = api.sponsor.update.useMutation({
    onSuccess: () => utils.sponsor.getAll.invalidate(),
  });
  const removeCurrent = api.sponsor.removeCurrent.useMutation({
    onSuccess: () => utils.sponsor.getAll.invalidate(),
  });

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
                {slot._count.bids} checkout{slot._count.bids === 1 ? "" : "s"}{" "}
                created
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
              Starting price (€)
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
            Recent bid history
          </summary>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[680px] text-left font-text text-xs">
              <thead className="text-body/35">
                <tr>
                  <th className="py-2 font-normal">Sponsor</th>
                  <th className="py-2 font-normal">Email</th>
                  <th className="py-2 font-normal">Amount</th>
                  <th className="py-2 font-normal">Status</th>
                  <th className="py-2 text-right font-normal">Created</th>
                </tr>
              </thead>
              <tbody>
                {slot.bids.map((bid) => (
                  <tr
                    className="border-t border-body/10 text-body/70"
                    key={bid.id}
                  >
                    <td className="py-2.5 font-medium text-headings">
                      {bid.advertiserName}
                    </td>
                    <td className="py-2.5">{bid.advertiserEmail}</td>
                    <td className="py-2.5">{formatPrice(bid.amount)}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-surface-200/60 px-2 py-1 uppercase">
                        {bid.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-body/40">
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
      {slots.map((slot) => (
        <SponsorSlotCard key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
