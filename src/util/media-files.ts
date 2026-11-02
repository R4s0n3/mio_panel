/** Normalize ZIP MIME aliases and filename fallbacks used by browser file pickers. */
export function mediaFileMimeType(file: {
  name: string;
  type: string;
}): string | undefined {
  if (["image/jpeg", "image/png", "application/pdf"].includes(file.type))
    return file.type;
  if (["application/zip", "application/x-zip-compressed"].includes(file.type))
    return "application/zip";
  if (
    (!file.type || file.type === "application/octet-stream") &&
    /\.zip$/i.test(file.name)
  )
    return "application/zip";
  return undefined;
}
