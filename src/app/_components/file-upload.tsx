import { CloudArrowUpIcon } from "@heroicons/react/16/solid";
import { useRef, useState } from "react";

type FileUploadProps = {
  accept?: string;
  label?: string;
  onPickedFile: (file: File) => void;
};

export default function FileUpload({
  accept = "application/pdf",
  label = "File Drop",
  onPickedFile,
}: FileUploadProps) {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  function pickFile(file: File | undefined) {
    if (!file) return;
    setPickedFile(file);
    onPickedFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    pickFile(event.dataTransfer.files[0]);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onClick={() => uploadRef.current?.click()}
      className="border-primary-50 text-primary-500/20 hover:border-primary-50/20 hover:bg-primary-500/20 group flex size-full cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed transition duration-500 hover:border-solid hover:text-primary-800"
    >
      <CloudArrowUpIcon className="size-8" />
      {pickedFile?.name ?? label}
      <input
        accept={accept}
        onChange={(event) => pickFile(event.currentTarget.files?.[0])}
        ref={uploadRef}
        className="hidden"
        type="file"
      />
    </div>
  );
}
