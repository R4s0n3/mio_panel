"use client";
import { api } from "@/trpc/react";
import Link from "next/link";
import Image from "next/image";
import { PhotoIcon, PlusIcon } from "@heroicons/react/24/solid";
import LoadingSpinner from "@/app/_components/loading-spinner";

export default function ProductsGrid() {
  const [products] = api.product.getAll.useSuspenseQuery();
  if (!products) return <LoadingSpinner />;
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <Link
        className="flex aspect-video items-center justify-center rounded border-2 border-primary-800 border-opacity-50 bg-primary-800/70 font-subhead transition duration-500 hover:bg-primary-800/90"
        key="create"
        href={`products/create`}
      >
        <PlusIcon className="size-8" />
      </Link>
      {products?.map((p) => (
        <Link
          className="relative flex aspect-video items-end overflow-hidden rounded border-2 border-primary-800 border-opacity-50 bg-primary-800/70 font-subhead transition duration-500 hover:bg-primary-800/90"
          key={p.id}
          href={`products/${p.id}`}
        >
          {p.image ? (
            <Image
              src={p.image}
              alt={p.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-headings/30">
              <PhotoIcon className="size-10" />
            </div>
          )}
          <div className="relative w-full bg-primary-900/75 p-3">
            <p className="truncate">{p.name}</p>
            <p className="text-xs uppercase text-body/70">{p.type.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
