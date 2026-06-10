import { env } from "@/env";

export interface FileItem {
  name: string;
  src: string;
  type: FileType;
  size: number;
}

type FileType = "PDF" | "IMAGE_PNG" | "IMAGE_JPEG"

interface UploadResponse {
  files: FileData | FileData[]
}

interface FileData {
  fileName: string;
  originalName?: string;
  url: string;
  mimetype: string;
  size: number;
}


interface UploadInput {
  data: Buffer;
  name: string;
}

const UPLOAD_URL = env.UPLOAD_URL;
const UPLOAD_KEY = env.UPLOAD_KEY;

if (!UPLOAD_URL || !UPLOAD_KEY) {
  throw new Error("missing UPLOAD_ENV variables")
}

export default async function uploadFiles(files: UploadInput[]): Promise<FileItem[]> {

  if (!files || files.length === 0) {
    return []
  }

  const isBulk = files.length > 1
  const endpoint = `${UPLOAD_URL}${isBulk ? "bulk" : "single"}`
  const formData = createUploadFormData(files)
  let response: Response

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-API-KEY": UPLOAD_KEY
      },
      body: formData
    })
  } catch (err) {
    throw new Error("Network error during upload")
  }


  if (!response.ok) {
    const errorText = await safeReadResponseText(response)
    throw new Error(`UPLOAD FAILED: ${errorText}`)
  }

  const json = (await response.json()) as UploadResponse

  return normalizeUploadResponse(json)

};


/**
 * Builds FormData for single or multiple file upload.
 */
function createUploadFormData(files: UploadInput[]): FormData {
  const formData = new FormData();

  if (files.length === 1) {
    const { data, name } = files[0]!;
    const mimeType = getFileTypeFromBuffer(data) ?? "application/pdf";

    const file = new File([data as BlobPart], name, { type: mimeType });
    formData.append("file", file, name);
  } else {
    files.forEach((file, index) => {
      const mimeType = getFileTypeFromBuffer(file.data) ?? "";
      const f = new File([file.data as BlobPart], file.name, { type: mimeType });

      // If your backend expects "files" or "file[]", adjust here
      formData.append("files", f, `file-${index}`);
    });
  }

  return formData;
}

/**
 * Converts the upload service response to your FileItem type.
 */
function normalizeUploadResponse(response: UploadResponse): FileItem[] {
  const filesArray = Array.isArray(response.files)
    ? response.files
    : [response.files];

  return filesArray.map((file) => ({
    size: file.size,
    name: file.originalName ?? file.fileName,
    src: file.url,
    type: getFileType(file.mimetype),
  }));
}

/**
 * Map a mimetype string to your FileType enum.
 */
function getFileType(mimeType: string): FileType {
  const mimeToFileType: Record<string, FileType> = {
    "application/pdf": "PDF",
    "image/png": "IMAGE_PNG",
    "image/jpeg": "IMAGE_JPEG",
    "image/jpg": "IMAGE_JPEG",
  };

  // Fallback: JPEG is a relatively safe default for "image-ish" content
  return mimeToFileType[mimeType] ?? "IMAGE_JPEG";
}

/**
 * Very small helper so error handling doesn't blow up if body is unreadable.
 */
async function safeReadResponseText(response: Response): Promise<string | null> {
  try {
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Heuristic MIME detection from a Buffer (magic numbers).
 * If you need stricter behavior, you could throw instead of returning null.
 */
function getFileTypeFromBuffer(buffer: Buffer): string | null {
  const magicNumbers = buffer.subarray(0, 8).toString("hex").toLowerCase();

  const signatures: Record<string, string> = {
    "89504e47": "image/png", // PNG
    "25504446": "application/pdf", // PDF
    ffd8ff: "image/jpeg", // JPEG
    "47494638": "image/gif", // GIF
    "52494646": "image/webp", // WebP (RIFF + WEBP check)
    "504b0304": "application/zip", // ZIP
    "1f8b": "application/gzip", // GZIP
  };

  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (magicNumbers.startsWith(signature)) {
      // Extra check for WebP in RIFF container
      if (
        signature === "52494646" &&
        buffer.subarray(8, 12).toString("ascii") !== "WEBP"
      ) {
        continue;
      }
      return mimeType;
    }
  }

  return null;
}

/**
 * Returns the Base64 content part of a data URL or raw Base64 string.
 */
export function getBase64(file: string): string {
  const base64Content = file.includes(";base64,")
    ? file.split(";base64,")[1]
    : file;

  if (!base64Content) {
    throw new Error("Invalid Base64 string: no content found");
  }

  return base64Content;
}
