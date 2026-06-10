"use client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { api } from "@/trpc/react";
import LoadingSpinner from "@/app/_components/loading-spinner";

import { CloudArrowUpIcon } from "@heroicons/react/24/solid";
import type { PostStatus } from "@prisma/client";

type ProjectInputs = {
  id?: number;
  name: string;
  content?: string | null;
  url?: string | null;
  image?: string | null;
  status: PostStatus;
};

type ProjectFormProps = {
  existingProject?: ProjectInputs;
};

const projectStatuses = ["PUBLIC", "FEATURED", "DRAFT", "HIDDEN"] as const;

export default function ProjectForm(props: ProjectFormProps) {
  const { register, reset, handleSubmit } = useForm({
    defaultValues: props.existingProject,
  });

  const utils = api.useUtils();
  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      reset();
    },
  });

  const updateProject = api.project.update.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
    },
  });

  const onSubmit: SubmitHandler<ProjectInputs> = (data) => {
    if (props.existingProject?.id) {
      const projectData = {
        id: props.existingProject.id,
        name: data.name,
        content: data.content ?? "",
        status: data.status,
        url: data.url ?? "",
        image: data.image ?? "",
      };
      updateProject.mutate(projectData);
    } else {
      const projectData = {
        name: data.name,
        content: data.content ?? "",
        status: data.status,
        url: data.url ?? "",
        image: data.image ?? "",
      };
      createProject.mutate(projectData);
    }
  };
  if (createProject.isPending || updateProject.isPending)
    return <LoadingSpinner />;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 lg:flex-row"
    >
      <div className="flex-[2] rounded bg-primary-800 p-4">
        <div className="flex h-full w-full flex-col gap-8">
          <h2 className="font-subhead text-4xl">PROJECT INFO</h2>
          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Name</label>
            <input
              className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
              {...register("name", { required: true })}
              placeholder="Enter project name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">
              Description (optional){" "}
            </label>
            <input
              className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
              {...register("content")}
              placeholder="Describe the project"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Destination URL</label>
            <input
              className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
              {...register("url")}
              placeholder="https://link-to-project.com"
            />
          </div>
          <div className="mt-auto">
            <button
              type="submit"
              className="rounded bg-secondary-900/80 p-4 px-8 transition duration-500 hover:bg-secondary-900"
            >
              ADD PROJECT
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-8 rounded bg-primary-800 p-4">
        <div>
          <h2 className="font-subhead text-4xl">SETTINGS</h2>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl text-headings">Status</label>
          <select
            defaultValue={"PUBLIC"}
            {...register("status", { required: true })}
            className="w-full rounded bg-headings/50 p-2 text-3xl text-secondary-800 placeholder:text-secondary-800"
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h2 className="font-subhead text-4xl">PROJECT IMAGE</h2>
        </div>
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Image URL</label>
            <div className="flex items-center justify-center gap-4">
              <input
                className="w-full rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
                {...register("image")}
                placeholder="https://cdn.miomideal.com/..."
              />
              <button
                disabled
                type="button"
                className={`flex aspect-square h-full items-center justify-center rounded bg-secondary-900/80 p-2 text-3xl hover:bg-secondary-900 disabled:bg-surface-200 disabled:opacity-10`}
              >
                <CloudArrowUpIcon className="size-8" />
              </button>
            </div>
          </div>
        </div>

        <div></div>
      </div>
    </form>
  );
}
