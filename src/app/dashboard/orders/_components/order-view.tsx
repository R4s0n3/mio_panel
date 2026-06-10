"use client";

import { api, type RouterOutputs } from "@/trpc/react";
import {
  CheckIcon,
  MagnifyingGlassCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderSummary = RouterOutputs["order"]["getView"]["all"][number];

function formatMoney(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getOrderTotal(order: OrderSummary) {
  return order.items.reduce(
    (total, item) => total + item.product.price * item.qty,
    0,
  );
}

function getCustomerEmail(order: OrderSummary) {
  return (
    order.customerEmail ?? order.shipping?.email ?? order.user?.email ?? ""
  );
}

function matchesSearch(order: OrderSummary, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const searchableValues = [
    order.id,
    order.status,
    order.customerEmail,
    order.shipping?.email,
    order.shipping?.name,
    order.shipping?.lastName,
    order.user?.email,
    order.user?.name,
    ...order.items.map((item) => item.product.name),
  ];

  return searchableValues.some((value) =>
    (value ?? "").toLowerCase().includes(query),
  );
}

function OrderLink({ order, index }: { order: OrderSummary; index: number }) {
  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="rounded bg-surface p-2 text-sm text-headings transition duration-300 hover:bg-primary-800"
    >
      <span className="mr-2 text-body/70">{index + 1}</span>
      <span className="font-subhead uppercase">{order.status}</span>
      <span className="ml-2 text-body/80">
        {formatMoney(getOrderTotal(order))}
      </span>
    </Link>
  );
}

export default function OrderView() {
  const router = useRouter();
  const [orders] = api.order.getView.useSuspenseQuery();
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSlice, setOrderSlice] = useState(0);

  const filteredOrders = orders.all.filter((order) =>
    matchesSearch(order, orderSearch),
  );
  const visibleOrders = filteredOrders.slice(orderSlice, orderSlice + 10);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-8">
      <div className="flex w-full flex-col gap-4 lg:flex-row">
        <div className="order-1 flex aspect-video flex-1 flex-col gap-2 overflow-y-auto rounded bg-surface-200 p-2">
          <h2 className="font-subhead text-xl">Recent Orders</h2>
          {orders.latest.map((order, index) => (
            <OrderLink key={order.id} order={order} index={index} />
          ))}
          {orders.latest.length === 0 && <div>NO ORDERS LATELY.</div>}
        </div>

        <div className="order-3 flex-grow lg:order-2">
          <form className="flex w-full flex-col gap-4">
            <label className="flex items-center gap-2 font-subhead text-3xl">
              <MagnifyingGlassCircleIcon className="size-6" /> ORDER SEARCH
            </label>
            <input
              className="flex-grow rounded bg-surface-200 p-2"
              placeholder="search orders"
              onChange={(event) => {
                setOrderSearch(event.target.value);
                setOrderSlice(0);
              }}
              value={orderSearch}
            />
          </form>
        </div>

        <div className="order-2 flex aspect-video flex-1 flex-col gap-2 overflow-y-auto rounded bg-surface-200 p-2 lg:order-3">
          <h2 className="font-subhead text-xl">Needs Action</h2>
          {orders.urgent.map((order, index) => (
            <OrderLink key={order.id} order={order} index={index} />
          ))}
          {orders.urgent.length === 0 && <div>CURRENTLY NO URGENT ORDERS.</div>}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-body">
          <thead className="bg-surface-200">
            <tr className="text-headings">
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                Customer
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                Items
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                Total
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                Updated
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              >
                User
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-body bg-surface">
            {visibleOrders.map((order) => (
              <tr
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                key={order.id}
                className="cursor-pointer text-headings hover:bg-surface-200/20"
              >
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {order.id.slice(0, 12)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm uppercase">
                  {order.status}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {getCustomerEmail(order) || "N/A"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {order.items.reduce((total, item) => total + item.qty, 0)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {formatMoney(getOrderTotal(order))}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {formatDate(order.updatedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {order.user ? (
                    <CheckIcon className="size-6" />
                  ) : (
                    <XMarkIcon className="size-6" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="w-full bg-surface p-1 px-4 text-center text-sm">
            CURRENTLY NO ORDERS FOUND.
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <button
            className="rounded-sm bg-surface-200 p-2 px-6 disabled:opacity-10"
            disabled={orderSlice === 0}
            onClick={() => setOrderSlice((prev) => Math.max(prev - 10, 0))}
          >
            Prev
          </button>
          <button
            className="rounded-sm bg-surface-200 p-2 px-6 disabled:opacity-10"
            disabled={orderSlice + 10 >= filteredOrders.length}
            onClick={() => setOrderSlice((prev) => prev + 10)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
