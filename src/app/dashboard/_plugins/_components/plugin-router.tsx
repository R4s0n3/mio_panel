'use client';
import LoadingSpinner from "@/app/_components/loading-spinner";
import React, { useState } from "react";

const defaultPlugins = [
    "user"
];

export default function PluginRouter(props: { plugins: string[] }) {
    const { plugins } = props;
   
    const [pluginsAvailable] = useState<string[]>(plugins);
    const [loadedPlugins, setLoadedPlugins] = useState<string[]>(defaultPlugins);

    function togglePlugin(event: React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        const pluginName = event.currentTarget.id;

        const isActive = loadedPlugins.includes(pluginName);

        if (isActive) {
            const newPlugins = loadedPlugins.filter((p) => p !== pluginName);
            setLoadedPlugins(newPlugins);
        } else {
            setLoadedPlugins((prevPlugins) => [...prevPlugins, pluginName]);
        }
    }

    function handleClosePlugin(event: React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        const pluginIndex = parseInt(event.currentTarget.id);
        const filteredPlugins = loadedPlugins.filter((_, idx: number) => idx !== pluginIndex);
        setLoadedPlugins(filteredPlugins);
    }

    return (
        <div className="w-full gap-8 flex justify-center flex-col items-center bg-tappen-blue-900 pb-12">
            <div className="w-full bg-primary-600 flex justify-center items-center">
                <div className="w-full flex gap-0.5 items-center">
                    <h2 className="px-4">Plugins:</h2>
                    {pluginsAvailable.map((pluginName) => (
                        <button
                            className={`p-2 px-5 ${loadedPlugins.includes(pluginName) ? "bg-primary-900/80" : "bg-primary-900/50"}`}
                            onClick={togglePlugin}
                            id={pluginName}
                            key={pluginName}
                        >
                            {pluginName}
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-full flex justify-center items-center p-4">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loadedPlugins.map((pluginName, idx: number) => {
                        const Plugin = React.lazy(() => import(`../${pluginName}`));
                        return (
                            <div
                            key={idx}
                            className="col-span-1 bg-primary-800/90 aspect-video border-2 shadow shadow-primary-950/10 border-primary-900 rounded relative"
                            >
                                <button
                                    className="absolute top-1 right-3 inline-block cursor-pointer text-tappen-blue-100/50 text-xl"
                                    id={idx.toString()}
                                    onClick={handleClosePlugin}
                                >
                                    x
                                </button>
                                <React.Suspense fallback={<LoadingSpinner />}>
                                    <Plugin />
                                </React.Suspense>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
