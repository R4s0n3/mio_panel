'use client';
import { api } from '@/trpc/react';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/solid'; // or wherever it's located
import LoadingSpinner from '@/app/_components/loading-spinner';

export default function ParcelGrid() {
  const [parcels] = api.parcel.getAll.useSuspenseQuery();
  
  if(!parcels) return <LoadingSpinner />
  return (
    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Link
        className="bg-primary-800/70 hover:bg-primary-800/90 transition duration-500  flex justify-center items-center font-subhead aspect-video rounded border-2 border-primary-800 border-opacity-50"
        key="create"
        href={`parcels/create`}
      >
        <PlusIcon className="size-8" />
      </Link>
      {parcels?.map((p) => (
        <Link
          className="bg-primary-800/70 hover:bg-primary-800/90 transition duration-500  flex justify-center items-center font-subhead aspect-video rounded border-2 border-primary-800 border-opacity-50"
          key={p.id}
          href={`parcels/${p.id}`}
        >
          {p.name}
        </Link>
      ))}
    </div>
  )
}