import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f(
    {
      blob: {
        maxFileSize: "64MB",
        maxFileCount: 5,
      },
    },
    { awaitServerData: false },
  )
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (!user) {
        throw new UploadThingError("User not found");
      }

      return { userId: session.user.id, storageUsed: user.storageUsed, storageLimit: user.storageLimit };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileId = uuidv4();
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const filename = fileId + (ext ? "." + ext : "");

      const fileSize = BigInt(file.size);

      if (metadata.storageUsed + fileSize > metadata.storageLimit) {
        throw new UploadThingError("Storage limit exceeded");
      }

      await prisma.file.create({
        data: {
          ownerId: metadata.userId,
          filename: filename,
          originalName: file.name,
          storagePath: "ut:" + file.key,
          fileData: null,
          size: fileSize,
          mimeType: file.type || "application/octet-stream",
          folderId: null,
        },
      });

      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          storageUsed: {
            increment: fileSize,
          },
        },
      });

      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl, fileKey: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
