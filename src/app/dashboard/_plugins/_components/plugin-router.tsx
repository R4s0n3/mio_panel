"use client";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { PuzzlePieceIcon, XMarkIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";

const defaultPlugins = ["user"];

export default function PluginRouter(props: { plugins: string[] }) {
  const { plugins } = props;

  const [pluginsAvailable] = useState<string[]>(plugins);
  const [loadedPlugins, setLoadedPlugins] = useState<string[]>(() =>
    defaultPlugins.filter((pluginName) => plugins.includes(pluginName)),
  );

  function togglePlugin(pluginName: string) {
    setLoadedPlugins((current) => {
      if (current.includes(pluginName)) {
        return current.filter((plugin) => plugin !== pluginName);
      }

      return [...current, pluginName];
    });
  }

  function handleClosePlugin(pluginIndex: number) {
    setLoadedPlugins((current) =>
      current.filter((_, idx: number) => idx !== pluginIndex),
    );
  }

  return (
    <section className="w-full border-t border-surface-200/70 bg-primary-900/45 px-4 pb-12 pt-8 sm:px-6 xl:px-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-accent">
          <PuzzlePieceIcon className="size-5" />
          <h2 className="font-subhead text-xl">Extensions</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {pluginsAvailable.map((pluginName) => {
            const active = loadedPlugins.includes(pluginName);

            return (
              <button
                className={`rounded border px-3 py-2 font-subhead text-xs uppercase transition duration-300 ${
                  active
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-surface-200 bg-primary-800/80 text-body/70 hover:border-accent/40 hover:text-accent"
                }`}
                key={pluginName}
                onClick={() => togglePlugin(pluginName)}
                type="button"
              >
                {pluginName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loadedPlugins.map((pluginName, idx: number) => {
          const Plugin = React.lazy(() => import(`../${pluginName}`));

          return (
            <div
              className="relative col-span-1 aspect-video overflow-hidden rounded-lg border border-surface-200 bg-primary-800/90 shadow-lg shadow-primary-900/30"
              key={`${pluginName}-${idx}`}
            >
              <button
                aria-label={`Close ${pluginName} plugin`}
                className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded bg-primary-900/80 text-body/70 transition duration-300 hover:text-highlight-magenta"
                onClick={() => handleClosePlugin(idx)}
                type="button"
              >
                <XMarkIcon className="size-4" />
              </button>
              <React.Suspense fallback={<LoadingSpinner />}>
                <Plugin />
              </React.Suspense>
            </div>
          );
        })}
      </div>

      {loadedPlugins.length === 0 && (
        <div className="flex min-h-32 items-center justify-center rounded border border-dashed border-body/20 bg-primary-800/50 text-sm text-body/55">
          No extensions loaded.
        </div>
      )}
    </section>
  );
}
