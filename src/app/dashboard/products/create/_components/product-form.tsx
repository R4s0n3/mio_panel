"use client";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { api } from "@/trpc/react";
import {
  CloudArrowUpIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";

interface ProductInputs {
  name: string;
  type: string;
  description: string;
  price: number;
  weight: string;
  image: string;
  details: string[];
}

type ProductFormProps = {
  productId?: string;
};

function formatCentsToDisplay(cents: number) {
  const floatValue = (cents / 100).toFixed(2);
  return floatValue.replace(".", ",");
}

function parseDisplayToCents(display: string) {
  const normalized = display.replace(",", ".");
  const floatValue = parseFloat(normalized);
  return Number.isNaN(floatValue) ? 0 : Math.round(floatValue * 100);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read file data."));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export default function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const [existingTypes] = api.type.getAll.useSuspenseQuery();
  const [existingProduct] = api.product.fromParams.useSuspenseQuery(
    props.productId ?? "",
  );
  const [productImages] = api.media.getProductImages.useSuspenseQuery();

  const defaultType = existingTypes[0]?.id ?? "";
  const { control, register, reset, handleSubmit, setValue, watch } =
    useForm<ProductInputs>({
      defaultValues: {
        name: existingProduct?.name ?? "",
        type: existingProduct?.type.id ?? defaultType,
        description: existingProduct?.description ?? "",
        price: existingProduct?.price ?? 0,
        weight: existingProduct?.weight ?? "",
        image: existingProduct?.image ?? "",
        details: existingProduct?.detailImages.map((image) => image.id) ?? [],
      },
    });

  const [deleteMode, setDeleteMode] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<string>("");
  const [selectedDetailImageIds, setSelectedDetailImageIds] = useState<
    string[]
  >(existingProduct?.detailImages.map((image) => image.id) ?? []);
  const mainImage = watch("image");

  const utils = api.useUtils();
  const createProduct = api.product.create.useMutation({
    onSuccess: async (product) => {
      await utils.product.invalidate();
      router.push(`/dashboard/products/${product.id}`);
    },
  });

  const updateProduct = api.product.update.useMutation({
    onSuccess: async () => {
      await utils.product.invalidate();
    },
  });

  const deleteProduct = api.product.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard/products");
    },
  });

  const uploadImages = api.media.upload.useMutation({
    onSuccess: async (uploadedImages) => {
      await utils.media.getProductImages.invalidate();

      const uploadedIds = uploadedImages.map((image) => image.id);
      if (uploadedIds.length > 0) {
        syncDetailImages([...selectedDetailImageIds, ...uploadedIds]);
      }

      const primaryImage = uploadedImages[0];
      if (primaryImage && !mainImage) {
        setValue("image", primaryImage.imageUrl, { shouldDirty: true });
      }
    },
  });

  useEffect(() => {
    if (!existingProduct) return;

    const nextDetailImages = existingProduct.detailImages.map(
      (image) => image.id,
    );
    reset({
      name: existingProduct.name,
      type: existingProduct.type.id,
      description: existingProduct.description ?? "",
      price: existingProduct.price ?? 0,
      weight: existingProduct.weight ?? "",
      image: existingProduct.image ?? "",
      details: nextDetailImages,
    });
    setSelectedDetailImageIds(nextDetailImages);
    setDisplayPrice(formatCentsToDisplay(existingProduct.price ?? 0));
  }, [existingProduct, reset]);

  function syncDetailImages(nextImageIds: string[]) {
    const uniqueImageIds = [...new Set(nextImageIds)];
    setSelectedDetailImageIds(uniqueImageIds);
    setValue("details", uniqueImageIds, { shouldDirty: true });
  }

  function toggleDetailImage(imageId: string) {
    if (selectedDetailImageIds.includes(imageId)) {
      syncDetailImages(selectedDetailImageIds.filter((id) => id !== imageId));
      return;
    }

    syncDetailImages([...selectedDetailImageIds, imageId]);
  }

  async function handleUpload(files: FileList | null) {
    const imageFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length === 0) return;

    const uploadPayload = await Promise.all(
      imageFiles.map(async (file) => ({
        name: file.name,
        data: await readFileAsDataUrl(file),
      })),
    );

    uploadImages.mutate({ files: uploadPayload });
  }

  const onSubmit: SubmitHandler<ProductInputs> = (data) => {
    const productData = {
      name: data.name,
      description: data.description ?? "",
      type: data.type,
      price: data.price ?? 0,
      image: data.image ?? "",
      weight: data.weight ?? "",
      details: selectedDetailImageIds,
    };

    if (existingProduct?.id) {
      updateProduct.mutate({
        id: existingProduct.id,
        ...productData,
      });
      return;
    }

    createProduct.mutate(productData);
  };

  function handleDeleteProduct() {
    if (!existingProduct) return;
    deleteProduct.mutate(existingProduct.id);
  }

  if (createProduct.isPending || updateProduct.isPending)
    return <LoadingSpinner />;

  if (deleteMode) {
    return (
      <div className="absolute left-0 top-0 flex size-full items-center justify-center bg-primary-900/90">
        <div className="flex w-full max-w-xs flex-col gap-4 rounded bg-secondary-800 p-2 font-text">
          <h2 className="font-subhead text-3xl">Are you sure?</h2>
          <p>
            You are about to delete this product, this procedure is final and
            cannot be undone.
          </p>
          <div className="flex w-full justify-between">
            <button type="button" onClick={() => setDeleteMode(false)}>
              Cancel
            </button>
            <button type="button" onClick={handleDeleteProduct}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 lg:flex-row"
    >
      <div className="flex-[2] rounded bg-primary-800 p-4">
        <div className="flex h-full w-full flex-col gap-8">
          <h2 className="font-subhead text-4xl">PRODUCT INFO</h2>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Name</label>
            <input
              className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
              {...register("name", { required: true })}
              placeholder="Enter product name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Description</label>
            <textarea
              className="min-h-32 rounded bg-headings/50 p-2 text-xl placeholder:text-secondary-800"
              {...register("description")}
              placeholder="Describe the product"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Price</label>
            <Controller
              name="price"
              control={control}
              render={({ field: { onChange } }) => (
                <input
                  type="text"
                  className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
                  value={displayPrice}
                  onChange={(event) => {
                    setDisplayPrice(event.target.value);
                  }}
                  onBlur={() => {
                    const centsValue = parseDisplayToCents(displayPrice);
                    onChange(centsValue);
                    setDisplayPrice(formatCentsToDisplay(centsValue));
                  }}
                  placeholder="Enter price (e.g., 25,99)"
                />
              )}
            />
          </div>

          <div className="mt-auto">
            <button
              type="submit"
              className="rounded bg-secondary-900/80 p-4 px-8 transition duration-500 hover:bg-secondary-900"
            >
              {existingProduct?.id ? "UPDATE PRODUCT" : "ADD PRODUCT"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8 rounded bg-primary-800 p-4">
        <div>
          <h2 className="font-subhead text-4xl">SETTINGS</h2>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl text-headings">Type</label>
          <select
            className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
            {...register("type", { required: true })}
          >
            {existingTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl text-headings">Weight</label>
          <input
            className="rounded bg-headings/50 p-2 text-3xl placeholder:text-secondary-800"
            {...register("weight")}
            placeholder="estm. product weight"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-subhead text-4xl">PRODUCT IMAGE</h2>
          <div className="relative aspect-video overflow-hidden rounded bg-surface">
            {mainImage ? (
              <Image
                src={mainImage}
                alt="Selected product image"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-headings/40">
                <PhotoIcon className="size-12" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Image URL</label>
            <div className="flex items-center justify-center gap-4">
              <input
                className="w-full rounded bg-headings/50 p-2 text-xl placeholder:text-secondary-800"
                {...register("image")}
                placeholder="https://cdn.miomideal.com/..."
              />
              <label className="flex aspect-square h-full cursor-pointer items-center justify-center rounded bg-secondary-900/80 p-2 text-3xl transition duration-500 hover:bg-secondary-900">
                <CloudArrowUpIcon className="size-8" />
                <input
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(event) => {
                    void handleUpload(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {uploadImages.isPending && (
              <p className="text-sm text-body/80">Uploading images...</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xl text-headings">Detail Images</label>
            <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto pr-1">
              {productImages.map((image) => {
                const isSelected = selectedDetailImageIds.includes(image.id);

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => toggleDetailImage(image.id)}
                    className={`relative aspect-square overflow-hidden rounded border-2 transition duration-300 ${
                      isSelected
                        ? "border-highlight-green"
                        : "border-primary-800 opacity-60 hover:opacity-100"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Image
                      src={image.imageUrl}
                      alt="Uploaded product detail"
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </button>
                );
              })}
              {productImages.length === 0 && (
                <div className="col-span-2 rounded bg-surface p-4 text-center text-sm text-body/80">
                  No uploaded images yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {existingProduct && (
            <div>
              <button
                onClick={() => setDeleteMode(true)}
                type="button"
                className="flex items-center justify-center gap-4 rounded bg-highlight-magenta p-2 px-4"
              >
                <TrashIcon className="size-6" /> Delete Product
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
