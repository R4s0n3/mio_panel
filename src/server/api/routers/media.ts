import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import uploadFiles from "@/util/file-upload";
import { z } from "zod";

export const mediaRouter = createTRPCRouter({
  getProductImages: protectedProcedure.query(({ ctx }) => {
    return ctx.db.productImage.findMany({
      orderBy: {
        id: "desc",
      },
    });
  }),
  upload: protectedProcedure
    .input(
      z.object({
        files: z
          .object({
            name: z.string(),
            data: z.string(),
          })
          .array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { files } = input;
      const uploadData = [];

      for (const file of files) {
        let base64String = file.data;
        if (base64String.startsWith("data:")) {
          base64String = base64String.split(",")[1] ?? "";
        }

        const fileBuffer = Buffer.from(base64String, "base64");
        const fileToPush = {
          data: fileBuffer,
          name: file.name,
        };

        uploadData.push(fileToPush);
      }

      let dataResponse;
      try {
        dataResponse = await uploadFiles(uploadData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown upload error";
        throw new Error(`upload Err:: ${message}`);
      }

      const productImages = await Promise.all(
        dataResponse.map((uploadedFile) => {
          return ctx.db.productImage.create({
            data: {
              imageUrl: uploadedFile.src,
            },
          });
        }),
      );

      return productImages;
    }),
});
