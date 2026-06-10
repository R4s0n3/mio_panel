"use client";

import { api } from "@/trpc/react";
import { ArrowLeftIcon, PhotoIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const statusOptions = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
  "REFUND",
  "RETURNED",
  "EXCHANGED",
  "ON_HOLD",
] as const;

type FulfillmentStatus = (typeof statusOptions)[number];

type SingleOrderViewProps = {
  orderId: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toFulfillmentStatus(status: string): FulfillmentStatus {
  return statusOptions.find((option) => option === status) ?? "PENDING";
}

export default function SingleOrderView({ orderId }: SingleOrderViewProps) {
  const [order] = api.order.fromParams.useSuspenseQuery(orderId);
  const [selectedStatus, setSelectedStatus] = useState<FulfillmentStatus>(() =>
    toFulfillmentStatus(order.status),
  );
  const utils = api.useUtils();

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.order.invalidate();
    },
  });

  const total = order.items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
  const customerEmail =
    order.customerEmail ?? order.shipping?.email ?? order.user?.email;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/orders"
        className="flex w-fit items-center gap-2 rounded bg-surface-200 p-2 px-4"
      >
        <ArrowLeftIcon className="size-5" />
        Orders
      </Link>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded bg-primary-800 p-4">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-subhead text-sm uppercase text-body/70">
                Order
              </p>
              <h2 className="break-all font-subhead text-3xl text-headings">
                {order.id}
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(toFulfillmentStatus(event.target.value))
                }
                className="rounded bg-headings/50 p-2 text-primary-900"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={
                  selectedStatus === order.status || updateStatus.isPending
                }
                onClick={() =>
                  updateStatus.mutate({
                    id: order.id,
                    status: selectedStatus,
                  })
                }
                className="rounded bg-secondary-900/80 p-2 px-5 transition duration-300 hover:bg-secondary-900 disabled:opacity-30"
              >
                Update
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded bg-surface p-3">
              <p className="text-xs uppercase text-body/60">Status</p>
              <p className="font-subhead text-xl">{order.status}</p>
            </div>
            <div className="rounded bg-surface p-3">
              <p className="text-xs uppercase text-body/60">Customer Email</p>
              <p className="break-all text-sm">{customerEmail ?? "N/A"}</p>
            </div>
            <div className="rounded bg-surface p-3">
              <p className="text-xs uppercase text-body/60">Stripe Session</p>
              <p className="break-all text-sm">{order.shopId ?? "N/A"}</p>
            </div>
            <div className="rounded bg-surface p-3">
              <p className="text-xs uppercase text-body/60">Updated</p>
              <p className="text-sm">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="rounded bg-primary-800 p-4">
          <h3 className="mb-4 font-subhead text-2xl">Payment</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs uppercase text-body/60">Cart Ref</p>
              <p className="break-all">{order.cartRef}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-body/60">
                Confirmation Email
              </p>
              <p>{formatDate(order.confirmationEmailSentAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-body/60">Created</p>
              <p>{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded bg-primary-800 p-4">
          <h3 className="mb-4 font-subhead text-2xl">Items</h3>
          <div className="flex flex-col divide-y divide-body">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded bg-surface">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-headings/40">
                      <PhotoIcon className="size-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-subhead text-xl">{item.product.name}</p>
                  <p className="text-sm text-body/70">
                    {item.product.type.name}
                  </p>
                  <p className="text-sm text-body/70">
                    Qty {item.qty}
                    {item.size ? ` | Size ${item.size}` : ""}
                    {item.format ? ` | ${item.format}` : ""}
                    {item.color ? ` | ${item.color}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p>{formatMoney(item.product.price)}</p>
                  <p className="font-subhead text-xl">
                    {formatMoney(item.product.price * item.qty)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-body pt-4 font-subhead text-2xl">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        <div className="rounded bg-primary-800 p-4">
          <h3 className="mb-4 font-subhead text-2xl">Shipping</h3>
          {order.shipping ? (
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-body/60">Name</p>
                <p>
                  {order.shipping.name} {order.shipping.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-body/60">Address</p>
                <p>
                  {order.shipping.street} {order.shipping.number}
                </p>
                {order.shipping.optional && <p>{order.shipping.optional}</p>}
                <p>
                  {order.shipping.zip} {order.shipping.country}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-body/60">Contact</p>
                <p>{order.shipping.email}</p>
                <p>{order.shipping.phone ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-body/60">Shipping Ref</p>
                <p>{order.shipping.shipId ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-body/60">Cost</p>
                <p>{formatMoney(order.shipping.cost)}</p>
              </div>
            </div>
          ) : (
            <p className="text-body/80">
              No shipping details stored for this order.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
