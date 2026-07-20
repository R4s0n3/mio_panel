"use client";

import { api, type RouterOutputs } from "@/trpc/react";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CubeIcon,
  DocumentCurrencyEuroIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TagIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useMemo, useState } from "react";

type OrderSummary = RouterOutputs["order"]["getView"]["all"][number];
type ProductSummary = RouterOutputs["product"]["getAll"][number];
type ProjectSummary = RouterOutputs["project"]["getAll"][number];
type ParcelSummary = RouterOutputs["parcel"]["getAll"][number];
type ProductTypeSummary = RouterOutputs["type"]["getAll"][number];
type OrderStatus = OrderSummary["status"];
type OrderMode = "focus" | "open" | "all" | "done";
type SearchKind = "order" | "product" | "project" | "parcel" | "type";

const DAY_MS = 24 * 60 * 60 * 1000;

const moneyFormatter = new Intl.NumberFormat("de-DE", {
  currency: "EUR",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const shortDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
});

const weekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
});

const actionableStatuses = new Set<OrderStatus>([
  "PENDING",
  "PROCESSING",
  "ON_HOLD",
]);

const completeStatuses = new Set<OrderStatus>([
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
]);

const revenueStatuses = new Set<OrderStatus>([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "ON_HOLD",
  "EXCHANGED",
]);

const statusTones: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "border-body/20 bg-body/5 text-body/60",
  COMPLETED:
    "border-highlight-green/40 bg-highlight-green/10 text-highlight-green",
  DELIVERED:
    "border-highlight-green/40 bg-highlight-green/10 text-highlight-green",
  DECLINED:
    "border-highlight-magenta/40 bg-highlight-magenta/10 text-highlight-magenta",
  EXCHANGED: "border-accent/40 bg-accent/10 text-accent",
  ON_HOLD:
    "border-highlight-magenta/40 bg-highlight-magenta/10 text-highlight-magenta",
  PENDING:
    "border-highlight-magenta/40 bg-highlight-magenta/10 text-highlight-magenta",
  PROCESSING:
    "border-highlight-cyan/40 bg-highlight-cyan/10 text-highlight-cyan",
  REFUND:
    "border-highlight-magenta/40 bg-highlight-magenta/10 text-highlight-magenta",
  RETURNED:
    "border-highlight-magenta/40 bg-highlight-magenta/10 text-highlight-magenta",
  SHIPPED: "border-highlight-cyan/40 bg-highlight-cyan/10 text-highlight-cyan",
};

const metricTones = {
  cyan: {
    bar: "bg-highlight-cyan",
    border: "border-highlight-cyan/30",
    glow: "shadow-highlight-cyan/10",
    icon: "bg-highlight-cyan/10 text-highlight-cyan",
    text: "text-highlight-cyan",
  },
  green: {
    bar: "bg-highlight-green",
    border: "border-highlight-green/30",
    glow: "shadow-highlight-green/10",
    icon: "bg-highlight-green/10 text-highlight-green",
    text: "text-highlight-green",
  },
  magenta: {
    bar: "bg-highlight-magenta",
    border: "border-highlight-magenta/30",
    glow: "shadow-highlight-magenta/10",
    icon: "bg-highlight-magenta/10 text-highlight-magenta",
    text: "text-highlight-magenta",
  },
  violet: {
    bar: "bg-accent",
    border: "border-accent/30",
    glow: "shadow-accent/10",
    icon: "bg-accent/10 text-accent",
    text: "text-accent",
  },
} as const;

const searchMeta: Record<
  SearchKind,
  { label: string; tone: string; icon: typeof TruckIcon }
> = {
  order: {
    icon: TruckIcon,
    label: "Order",
    tone: "bg-highlight-cyan/10 text-highlight-cyan",
  },
  parcel: {
    icon: CubeIcon,
    label: "Parcel",
    tone: "bg-highlight-green/10 text-highlight-green",
  },
  product: {
    icon: DocumentCurrencyEuroIcon,
    label: "Product",
    tone: "bg-highlight-magenta/10 text-highlight-magenta",
  },
  project: {
    icon: BeakerIcon,
    label: "Project",
    tone: "bg-accent/10 text-accent",
  },
  type: {
    icon: TagIcon,
    label: "Type",
    tone: "bg-body/10 text-body",
  },
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getOrderTotal(order: OrderSummary) {
  return order.items.reduce(
    (total, item) => total + item.product.price * item.qty,
    0,
  );
}

function getOrderItems(order: OrderSummary) {
  return order.items.reduce((total, item) => total + item.qty, 0);
}

function present(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function getCustomerLabel(order: OrderSummary) {
  const name = [order.shipping?.name, order.shipping?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    present(name) ??
    present(order.customerEmail) ??
    present(order.shipping?.email) ??
    present(order.user?.email) ??
    present(order.user?.name) ??
    "Guest customer"
  );
}

function formatMoney(cents: number) {
  return moneyFormatter.format(cents / 100);
}

function formatCompact(value: number) {
  return compactFormatter.format(value);
}

function formatShortDate(value: Date | string) {
  return shortDateFormatter.format(toDate(value));
}

function formatAge(value: Date | string, now: Date) {
  const diff = Math.max(
    0,
    Math.floor((now.getTime() - toDate(value).getTime()) / DAY_MS),
  );

  if (diff === 0) return "Today";
  if (diff === 1) return "1 day";
  return `${diff} days`;
}

function safePercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function normalize(value: string | number | null | undefined) {
  return String(value ?? "").toLowerCase();
}

function matches(
  values: Array<string | number | null | undefined>,
  query: string,
) {
  const normalized = normalize(query.trim());
  if (!normalized) return true;

  return values.some((value) => normalize(value).includes(normalized));
}

function getStatusTone(status: OrderStatus) {
  return statusTones[status] ?? "border-body/20 bg-surface-200/30 text-body";
}

function getStatusLabel(status: OrderStatus) {
  return status.replace("_", " ");
}

function isActionable(order: OrderSummary) {
  return actionableStatuses.has(order.status);
}

function isComplete(order: OrderSummary) {
  return completeStatuses.has(order.status);
}

function isRevenueOrder(order: OrderSummary) {
  return revenueStatuses.has(order.status);
}

function productHref(product: ProductSummary) {
  return `/dashboard/products/${product.id}`;
}

function projectHref(project: ProjectSummary) {
  return `/dashboard/projects/${project.name
    .split(" ")
    .join("-")
    .toLocaleLowerCase()}-${project.id}`;
}

function parcelHref(parcel: ParcelSummary) {
  return `/dashboard/parcels/${parcel.id}`;
}

function typeHref(type: ProductTypeSummary) {
  return `/dashboard/product-types/${type.id}`;
}

function DashboardMetric({
  href,
  icon: Icon,
  label,
  meta,
  progress,
  tone,
  value,
}: {
  href: string;
  icon: typeof TruckIcon;
  label: string;
  meta: string;
  progress: number;
  tone: keyof typeof metricTones;
  value: string;
}) {
  const toneClasses = metricTones[tone];

  return (
    <Link
      href={href}
      className={`group flex min-h-40 flex-col justify-between rounded-lg border ${toneClasses.border} bg-primary-800/80 p-4 shadow-lg ${toneClasses.glow} transition duration-300 hover:-translate-y-1 hover:bg-surface/95 motion-reduce:transform-none`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-subhead text-xs uppercase text-body/60">{label}</p>
          <p className="mt-2 font-headline text-5xl leading-none text-headings">
            {value}
          </p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded ${toneClasses.icon}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-body/70">
          <span>{meta}</span>
          <ArrowRightIcon
            className={`size-4 transition duration-300 group-hover:translate-x-1 ${toneClasses.text}`}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-primary-900">
          <div
            className={`h-full origin-left animate-bar-grow rounded ${toneClasses.bar} motion-reduce:animate-none`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded border border-dashed border-body/20 bg-primary-900/30 px-4 text-center text-sm text-body/60">
      {label}
    </div>
  );
}

export default function DashboardOverview({ plugins }: { plugins: string[] }) {
  const [orders] = api.order.getView.useSuspenseQuery();
  const [products] = api.product.getAll.useSuspenseQuery();
  const [projects] = api.project.getAll.useSuspenseQuery();
  const [parcels] = api.parcel.getAll.useSuspenseQuery();
  const [types] = api.type.getAll.useSuspenseQuery();

  const [query, setQuery] = useState("");
  const [orderMode, setOrderMode] = useState<OrderMode>("focus");
  const now = useMemo(() => new Date(), []);

  const dashboard = useMemo(() => {
    const revenueOrders = orders.all.filter(isRevenueOrder);
    const openOrders = orders.all.filter(isActionable);
    const completedOrders = orders.all.filter(isComplete);
    const staleOrders = openOrders.filter(
      (order) =>
        now.getTime() - toDate(order.updatedAt).getTime() >= 3 * DAY_MS,
    );
    const urgentIds = new Set(orders.urgent.map((order) => order.id));
    const priorityMap = new Map<string, OrderSummary>();

    for (const order of [...orders.urgent, ...staleOrders, ...orders.latest]) {
      if (isActionable(order)) {
        priorityMap.set(order.id, order);
      }
    }

    const priorityOrders = Array.from(priorityMap.values()).sort((a, b) => {
      const urgentDelta =
        Number(urgentIds.has(b.id)) - Number(urgentIds.has(a.id));
      if (urgentDelta !== 0) return urgentDelta;

      return toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime();
    });

    const totalRevenue = revenueOrders.reduce(
      (total, order) => total + getOrderTotal(order),
      0,
    );
    const pipelineRevenue = openOrders.reduce(
      (total, order) => total + getOrderTotal(order),
      0,
    );
    const averageOrderValue =
      revenueOrders.length > 0
        ? Math.round(totalRevenue / revenueOrders.length)
        : 0;

    const statusCounts = orders.all.reduce<Record<string, number>>(
      (acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const statusRows = Object.entries(statusCounts).sort(
      ([, countA], [, countB]) => countB - countA,
    );

    const productMap = new Map<
      string,
      { id: string; name: string; qty: number; revenue: number }
    >();

    for (const order of orders.all) {
      for (const item of order.items) {
        const existing = productMap.get(item.product.id) ?? {
          id: item.product.id,
          name: item.product.name,
          qty: 0,
          revenue: 0,
        };

        existing.qty += item.qty;
        existing.revenue += item.product.price * item.qty;
        productMap.set(item.product.id, existing);
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weeklyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      return {
        date,
        key: getDayKey(date),
        orders: 0,
        revenue: 0,
      };
    });

    const bucketByKey = new Map(
      weeklyRevenue.map((bucket) => [bucket.key, bucket]),
    );

    for (const order of revenueOrders) {
      const createdAt = toDate(order.createdAt);
      const bucket = bucketByKey.get(getDayKey(createdAt));

      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += getOrderTotal(order);
      }
    }

    const maxDailyRevenue = Math.max(
      1,
      ...weeklyRevenue.map((bucket) => bucket.revenue),
    );

    const latestUpdated = orders.all.reduce<Date | null>((latest, order) => {
      const updatedAt = toDate(order.updatedAt);
      if (!latest || updatedAt > latest) return updatedAt;
      return latest;
    }, null);

    return {
      averageOrderValue,
      completedOrders,
      latestUpdated,
      maxDailyRevenue,
      openOrders,
      pipelineRevenue,
      priorityOrders,
      revenueOrders,
      staleOrders,
      statusRows,
      topProducts,
      totalRevenue,
      weeklyRevenue,
    };
  }, [now, orders.all, orders.latest, orders.urgent]);

  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const results: Array<{
      href: string;
      kind: SearchKind;
      label: string;
      meta: string;
    }> = [];

    for (const order of orders.all) {
      if (
        matches(
          [
            order.id,
            order.status,
            order.customerEmail,
            order.shipping?.email,
            order.shipping?.name,
            order.shipping?.lastName,
            order.user?.email,
            ...order.items.map((item) => item.product.name),
          ],
          trimmed,
        )
      ) {
        results.push({
          href: `/dashboard/orders/${order.id}`,
          kind: "order",
          label: getCustomerLabel(order),
          meta: `${getStatusLabel(order.status)} · ${formatMoney(
            getOrderTotal(order),
          )}`,
        });
      }
    }

    for (const product of products) {
      if (
        matches([product.name, product.description, product.type.name], trimmed)
      ) {
        results.push({
          href: productHref(product),
          kind: "product",
          label: product.name,
          meta: `${product.type.name} · ${formatMoney(product.price)}`,
        });
      }
    }

    for (const project of projects) {
      if (matches([project.name, project.id], trimmed)) {
        results.push({
          href: projectHref(project),
          kind: "project",
          label: project.name,
          meta: `Project #${project.id}`,
        });
      }
    }

    for (const parcel of parcels) {
      if (
        matches(
          [
            parcel.name,
            parcel.weight,
            parcel.height,
            parcel.length,
            parcel.width,
          ],
          trimmed,
        )
      ) {
        results.push({
          href: parcelHref(parcel),
          kind: "parcel",
          label: parcel.name,
          meta: `${parcel.weight}${parcel.massUnit} · ${parcel.length}x${parcel.width}x${parcel.height}${parcel.distanceUnit}`,
        });
      }
    }

    for (const type of types) {
      if (
        matches([type.name, type.shippable ? "shippable" : "digital"], trimmed)
      ) {
        results.push({
          href: typeHref(type),
          kind: "type",
          label: type.name,
          meta: type.shippable ? "Shippable type" : "Digital type",
        });
      }
    }

    return results.slice(0, 8);
  }, [orders.all, parcels, products, projects, query, types]);

  const visibleOrders = useMemo(() => {
    const base =
      orderMode === "focus"
        ? dashboard.priorityOrders
        : orderMode === "open"
          ? dashboard.openOrders
          : orderMode === "done"
            ? dashboard.completedOrders
            : orders.all;

    return base
      .filter((order) =>
        matches(
          [
            order.id,
            order.status,
            getCustomerLabel(order),
            order.customerEmail,
            ...order.items.map((item) => item.product.name),
          ],
          query,
        ),
      )
      .slice(0, 7);
  }, [
    dashboard.completedOrders,
    dashboard.openOrders,
    dashboard.priorityOrders,
    orderMode,
    orders.all,
    query,
  ]);

  const shippableTypeCount = types.filter((type) => type.shippable).length;
  const stockedProductCount = products.filter(
    (product) => product.weight,
  ).length;
  const fulfillmentScore = safePercent(
    dashboard.completedOrders.length,
    Math.max(1, dashboard.completedOrders.length + dashboard.openOrders.length),
  );

  const metrics = [
    {
      href: "/dashboard/orders",
      icon: TruckIcon,
      label: "Open orders",
      meta: `${orders.urgent.length} need action`,
      progress: safePercent(
        orders.urgent.length,
        Math.max(1, dashboard.openOrders.length),
      ),
      tone: "cyan" as const,
      value: formatCompact(dashboard.openOrders.length),
    },
    {
      href: "/dashboard/orders",
      icon: DocumentCurrencyEuroIcon,
      label: "Revenue",
      meta: `${formatMoney(dashboard.pipelineRevenue)} in pipeline`,
      progress: safePercent(
        dashboard.pipelineRevenue,
        Math.max(1, dashboard.totalRevenue),
      ),
      tone: "green" as const,
      value: formatMoney(dashboard.totalRevenue),
    },
    {
      href: "/dashboard/products",
      icon: Squares2X2Icon,
      label: "Catalog",
      meta: `${types.length} types · ${parcels.length} parcels`,
      progress: safePercent(stockedProductCount, Math.max(1, products.length)),
      tone: "magenta" as const,
      value: formatCompact(products.length),
    },
    {
      href: "/dashboard/projects",
      icon: BeakerIcon,
      label: "Projects",
      meta: `${plugins.length} dashboard plugins`,
      progress: safePercent(
        projects.length,
        Math.max(1, projects.length + plugins.length),
      ),
      tone: "violet" as const,
      value: formatCompact(projects.length),
    },
  ];

  const orderModes: Array<{ label: string; value: OrderMode }> = [
    { label: "Focus", value: "focus" },
    { label: "Open", value: "open" },
    { label: "Done", value: "done" },
    { label: "All", value: "all" },
  ];

  const quickActions = [
    {
      href: "/dashboard/products/create",
      icon: DocumentCurrencyEuroIcon,
      label: "Product",
      meta: "Create",
      tone: "text-highlight-magenta",
    },
    {
      href: "/dashboard/projects/create",
      icon: BeakerIcon,
      label: "Project",
      meta: "Publish",
      tone: "text-accent",
    },
    {
      href: "/dashboard/product-types/create",
      icon: TagIcon,
      label: "Type",
      meta: "Catalog",
      tone: "text-highlight-cyan",
    },
    {
      href: "/dashboard/parcels/create",
      icon: CubeIcon,
      label: "Parcel",
      meta: "Shipping",
      tone: "text-highlight-green",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="animate-rise-in motion-reduce:animate-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-subhead text-xs uppercase tracking-widest text-body/60">
              Admin control center
            </p>
            <h1 className="mt-1 font-headline text-5xl leading-none text-highlight-cyan sm:text-6xl">
              Dashboard
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-body/70">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 animate-pulse-soft rounded bg-highlight-green motion-reduce:animate-none" />
                Live operations
              </span>
              <span>
                {dashboard.latestUpdated
                  ? `Last order update ${formatShortDate(dashboard.latestUpdated)}`
                  : "No order activity yet"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded border border-highlight-cyan/30 bg-highlight-cyan/10 px-3 py-2 font-subhead text-sm text-highlight-cyan transition duration-300 hover:bg-highlight-cyan/20"
            >
              <TruckIcon className="size-4" />
              Orders
            </Link>
            <Link
              href="/dashboard/products/create"
              className="inline-flex items-center gap-2 rounded border border-highlight-magenta/30 bg-highlight-magenta/10 px-3 py-2 font-subhead text-sm text-highlight-magenta transition duration-300 hover:bg-highlight-magenta/20"
            >
              <PlusIcon className="size-4" />
              Product
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            className="animate-rise-in motion-reduce:animate-none"
            key={metric.label}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <DashboardMetric {...metric} />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <div className="flex flex-col gap-6">
          <div className="animate-rise-in rounded-lg border border-surface-200/70 bg-primary-800/75 p-4 shadow-lg shadow-primary-900/30 motion-reduce:animate-none">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-highlight-cyan">
                  <BoltIcon className="size-5" />
                  <h2 className="font-subhead text-xl">Order Workbench</h2>
                </div>
                <p className="mt-1 text-sm text-body/70">
                  {dashboard.staleOrders.length} stale ·{" "}
                  {formatMoney(dashboard.averageOrderValue)} average order
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {orderModes.map((mode) => (
                  <button
                    className={`rounded border px-3 py-2 font-subhead text-xs uppercase transition duration-300 ${
                      orderMode === mode.value
                        ? "border-highlight-cyan/50 bg-highlight-cyan/10 text-highlight-cyan"
                        : "border-surface-200 bg-primary-900/40 text-body/70 hover:border-highlight-cyan/40 hover:text-highlight-cyan"
                    }`}
                    key={mode.value}
                    onClick={() => setOrderMode(mode.value)}
                    type="button"
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {visibleOrders.map((order) => (
                <Link
                  className="group grid gap-3 rounded border border-surface-200/70 bg-surface/50 p-3 transition duration-300 hover:border-highlight-cyan/50 hover:bg-surface-100/80 sm:grid-cols-[minmax(0,1fr)_auto]"
                  href={`/dashboard/orders/${order.id}`}
                  key={order.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-1 font-subhead text-[11px] uppercase ${getStatusTone(
                          order.status,
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      {orders.urgent.some(
                        (urgent) => urgent.id === order.id,
                      ) && (
                        <span className="inline-flex items-center gap-1 rounded bg-highlight-magenta/10 px-2 py-1 text-[11px] uppercase text-highlight-magenta">
                          <ExclamationTriangleIcon className="size-3" />
                          Action
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate font-subhead text-lg text-headings">
                      {getCustomerLabel(order)}
                    </p>
                    <p className="mt-1 truncate text-sm text-body/65">
                      {getOrderItems(order)} items · updated{" "}
                      {formatAge(order.updatedAt, now)}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="font-headline text-3xl leading-none text-headings">
                      {formatMoney(getOrderTotal(order))}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-highlight-cyan">
                      Open
                      <ArrowRightIcon className="size-3 transition duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}

              {visibleOrders.length === 0 && (
                <EmptyState label="No orders match the current view." />
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="animate-rise-in rounded-lg border border-surface-200/70 bg-primary-800/75 p-4 shadow-lg shadow-primary-900/30 motion-reduce:animate-none">
              <div className="flex items-center gap-2 text-highlight-green">
                <ArrowTrendingUpIcon className="size-5" />
                <h2 className="font-subhead text-xl">Revenue Rhythm</h2>
              </div>
              <div className="mt-6 flex h-48 items-end gap-2">
                {dashboard.weeklyRevenue.map((bucket) => {
                  const height = safePercent(
                    bucket.revenue,
                    dashboard.maxDailyRevenue,
                  );

                  return (
                    <div
                      className="flex h-full flex-1 flex-col justify-end gap-2"
                      key={bucket.key}
                    >
                      <div className="flex flex-1 items-end rounded bg-primary-900/60 p-1">
                        <div
                          className="w-full origin-bottom animate-bar-grow rounded bg-highlight-green transition duration-500 motion-reduce:animate-none"
                          style={{ height: `${Math.max(5, height)}%` }}
                          title={`${formatMoney(bucket.revenue)} · ${bucket.orders} orders`}
                        />
                      </div>
                      <div className="text-center text-[11px] uppercase text-body/55">
                        {weekdayFormatter.format(bucket.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-200/70 pt-4 text-sm">
                <div>
                  <p className="text-body/55">AOV</p>
                  <p className="font-subhead text-headings">
                    {formatMoney(dashboard.averageOrderValue)}
                  </p>
                </div>
                <div>
                  <p className="text-body/55">Fulfillment</p>
                  <p className="font-subhead text-highlight-green">
                    {fulfillmentScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="animate-rise-in rounded-lg border border-surface-200/70 bg-primary-800/75 p-4 shadow-lg shadow-primary-900/30 motion-reduce:animate-none">
              <div className="flex items-center gap-2 text-highlight-magenta">
                <ChartBarIcon className="size-5" />
                <h2 className="font-subhead text-xl">Status Mix</h2>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {dashboard.statusRows.slice(0, 7).map(([status, count]) => {
                  const statusName = status as OrderStatus;
                  const percent = safePercent(count, orders.all.length);

                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="font-subhead uppercase text-body/80">
                          {getStatusLabel(statusName)}
                        </span>
                        <span className="text-body/55">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-primary-900">
                        <div
                          className="h-full origin-left animate-bar-grow rounded bg-highlight-magenta motion-reduce:animate-none"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {dashboard.statusRows.length === 0 && (
                  <EmptyState label="No order statuses yet." />
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="animate-rise-in rounded-lg border border-surface-200/70 bg-primary-800/75 p-4 shadow-lg shadow-primary-900/30 motion-reduce:animate-none">
            <label
              className="flex items-center gap-2 font-subhead text-xl text-highlight-cyan"
              htmlFor="dashboard-search"
            >
              <MagnifyingGlassIcon className="size-5" />
              Command Search
            </label>
            <div className="mt-4 flex items-center gap-2 rounded border border-surface-200 bg-primary-900/70 px-3 py-2 focus-within:border-highlight-cyan/60">
              <FunnelIcon className="size-4 text-body/45" />
              <input
                className="w-full bg-transparent text-sm text-headings outline-none placeholder:text-body/40"
                id="dashboard-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="orders, products, projects"
                value={query}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {searchResults.map((result) => {
                const meta = searchMeta[result.kind];
                const Icon = meta.icon;

                return (
                  <Link
                    className="group flex items-center gap-3 rounded border border-transparent bg-surface/40 p-2 transition duration-300 hover:border-highlight-cyan/40 hover:bg-surface-100/70"
                    href={result.href}
                    key={`${result.kind}-${result.href}`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded ${meta.tone}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-subhead text-sm text-headings">
                        {result.label}
                      </span>
                      <span className="block truncate text-xs text-body/55">
                        {meta.label} · {result.meta}
                      </span>
                    </span>
                    <ArrowRightIcon className="size-4 text-highlight-cyan opacity-0 transition duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                );
              })}

              {query.trim() && searchResults.length === 0 && (
                <EmptyState label="No matching admin records." />
              )}

              {!query.trim() && (
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <Link
                        className="group flex min-h-24 flex-col justify-between rounded border border-surface-200 bg-surface/40 p-3 transition duration-300 hover:border-highlight-cyan/40 hover:bg-surface-100/70"
                        href={action.href}
                        key={action.href}
                      >
                        <Icon className={`size-6 ${action.tone}`} />
                        <span>
                          <span className="block text-xs uppercase text-body/50">
                            {action.meta}
                          </span>
                          <span className="font-subhead text-sm text-headings">
                            {action.label}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="animate-rise-in rounded-lg border border-surface-200/70 bg-primary-800/75 p-4 shadow-lg shadow-primary-900/30 motion-reduce:animate-none">
            <div className="flex items-center gap-2 text-highlight-green">
              <CheckCircleIcon className="size-5" />
              <h2 className="font-subhead text-xl">Catalog Health</h2>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-body/65">
                  <span>Weighted products</span>
                  <span>
                    {stockedProductCount}/{products.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-primary-900">
                  <div
                    className="h-full origin-left animate-bar-grow rounded bg-highlight-cyan motion-reduce:animate-none"
                    style={{
                      width: `${safePercent(stockedProductCount, products.length)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-body/65">
                  <span>Shippable types</span>
                  <span>
                    {shippableTypeCount}/{types.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-primary-900">
                  <div
                    className="h-full origin-left animate-bar-grow rounded bg-highlight-green motion-reduce:animate-none"
                    style={{
                      width: `${safePercent(shippableTypeCount, types.length)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded border border-surface-200 bg-primary-900/50 p-2">
                  <p className="font-headline text-3xl text-headings">
                    {products.length}
                  </p>
                  <p className="text-[11px] uppercase text-body/55">Products</p>
                </div>
                <div className="rounded border border-surface-200 bg-primary-900/50 p-2">
                  <p className="font-headline text-3xl text-headings">
                    {types.length}
                  </p>
                  <p className="text-[11px] uppercase text-body/55">Types</p>
                </div>
                <div className="rounded border border-surface-200 bg-primary-900/50 p-2">
                  <p className="font-headline text-3xl text-headings">
                    {parcels.length}
                  </p>
                  <p className="text-[11px] uppercase text-body/55">Parcels</p>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-rise-in rounded-lg border border-surface-200/70 bg-primary-800/75 p-4 shadow-lg shadow-primary-900/30 motion-reduce:animate-none">
            <div className="flex items-center gap-2 text-accent">
              <ArrowPathIcon className="size-5" />
              <h2 className="font-subhead text-xl">Top Products</h2>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {dashboard.topProducts.map((product, index) => (
                <Link
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded border border-surface-200 bg-surface/40 p-2 transition duration-300 hover:border-accent/40 hover:bg-surface-100/70"
                  href={`/dashboard/products/${product.id}`}
                  key={product.id}
                >
                  <span className="font-headline text-2xl text-body/40">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-subhead text-sm text-headings">
                      {product.name}
                    </span>
                    <span className="block text-xs text-body/55">
                      {product.qty} sold
                    </span>
                  </span>
                  <span className="font-subhead text-sm text-accent">
                    {formatMoney(product.revenue)}
                  </span>
                </Link>
              ))}

              {dashboard.topProducts.length === 0 && (
                <EmptyState label="No product sales yet." />
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
