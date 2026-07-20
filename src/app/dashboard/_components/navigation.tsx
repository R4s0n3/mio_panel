"use client";

import {
  ArrowRightStartOnRectangleIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CubeIcon,
  DocumentCurrencyEuroIcon,
  Squares2X2Icon,
  TagIcon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: Squares2X2Icon, label: "Dashboard" },
  { href: "/dashboard/projects", icon: BeakerIcon, label: "Projects" },
  {
    href: "/dashboard/products",
    icon: DocumentCurrencyEuroIcon,
    label: "Products",
  },
  { href: "/dashboard/product-types", icon: TagIcon, label: "Product Types" },
  { href: "/dashboard/orders", icon: TruckIcon, label: "Orders" },
  { href: "/dashboard/parcels", icon: CubeIcon, label: "Parcels" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={`border-b border-highlight-cyan/70 bg-primary-800/95 p-4 pb-6 transition-all duration-500 lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r ${
        isOpen ? "lg:w-72" : "lg:w-20"
      }`}
    >
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            className={`min-w-0 font-headline text-3xl leading-none text-highlight-cyan transition duration-300 ${
              isOpen ? "lg:block" : "lg:hidden"
            }`}
            href="/dashboard"
          >
            Mio PANEL
          </Link>

          <button
            aria-label={isOpen ? "Collapse navigation" : "Expand navigation"}
            className="hidden size-11 items-center justify-center rounded border border-highlight-cyan/30 bg-highlight-cyan/10 text-highlight-cyan transition duration-300 hover:bg-highlight-cyan/20 lg:flex"
            onClick={() => setIsOpen((prev) => !prev)}
            type="button"
          >
            {isOpen ? (
              <ChevronLeftIcon className="size-6" />
            ) : (
              <ChevronRightIcon className="size-6" />
            )}
          </button>

          <button
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            className="flex size-11 items-center justify-center rounded border border-highlight-cyan/30 bg-highlight-cyan/10 text-highlight-cyan transition duration-300 hover:bg-highlight-cyan/20 lg:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            type="button"
          >
            {isOpen ? (
              <ChevronUpIcon className="size-6" />
            ) : (
              <ChevronDownIcon className="size-6" />
            )}
          </button>
        </div>

        <nav className={`${isOpen ? "block" : "hidden"} lg:block`}>
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center gap-3 rounded px-3 py-2 font-subhead text-sm uppercase transition duration-300 ${
                      active
                        ? "bg-highlight-cyan/10 text-highlight-cyan"
                        : "text-body/80 hover:bg-surface/70 hover:text-highlight-cyan"
                    } ${isOpen ? "" : "lg:justify-center lg:px-0"}`}
                    href={item.href}
                    title={isOpen ? undefined : item.label}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className={`${isOpen ? "" : "lg:hidden"}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className={`mt-auto flex flex-col gap-2 border-t border-surface-200/80 pt-4 ${
            isOpen ? "block" : "hidden lg:flex"
          }`}
        >
          <Link
            className={`flex min-h-10 items-center gap-3 rounded px-3 py-2 text-sm text-body/75 transition duration-300 hover:bg-surface/70 hover:text-highlight-magenta ${
              isOpen ? "" : "lg:justify-center lg:px-0"
            }`}
            href="/profile"
            title={isOpen ? undefined : "Profile"}
          >
            <UserCircleIcon className="size-5 shrink-0" />
            <span className={`${isOpen ? "" : "lg:hidden"}`}>Profile</span>
          </Link>
          <Link
            className={`flex min-h-10 items-center gap-3 rounded px-3 py-2 text-sm text-body/75 transition duration-300 hover:bg-surface/70 hover:text-highlight-magenta ${
              isOpen ? "" : "lg:justify-center lg:px-0"
            }`}
            href="/api/auth/signout"
            title={isOpen ? undefined : "Sign out"}
          >
            <ArrowRightStartOnRectangleIcon className="size-5 shrink-0" />
            <span className={`${isOpen ? "" : "lg:hidden"}`}>Sign Out</span>
          </Link>
          <span
            className={`pt-2 text-xs text-body/35 ${
              isOpen ? "block" : "hidden"
            }`}
          >
            © Mio Mideal
          </span>
        </div>
      </div>
    </aside>
  );
}
