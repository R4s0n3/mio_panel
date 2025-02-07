import { CheckCircleIcon, CloudArrowUpIcon } from "@heroicons/react/16/solid";
import { useRef, useCallback, useState} from "react";

type FileUploadProps = {
    onPickedFile: (file:File) => void
}

export default function FileUpload(props: FileUploadProps){
    const uploadRef = useRef<HTMLInputElement | null>(null)
    const [hasFile, setHasFile] = useState<File | null>(null)


    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        
        const files = event.dataTransfer?.files;
        if (files[0] && files.length > 0) {
            setHasFile(files[0] ?? null)
            props.onPickedFile(files[0])
        }
    }, [props]);

    function handleChange (event: React.ChangeEvent<HTMLInputElement>){
        event.preventDefault();
        event.stopPropagation();
        const file = event.target.files?.[0];
        setHasFile(file ?? null)
        if(file){
            props.onPickedFile(file)
        }
    }

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    if(hasFile) return <div onClick={() => setHasFile(null)}  className="size-full group cursor-pointer border-solid border-primary-800 text-primary-800 hover:border-primary-50/20  bg-primary-500/20 transition duration-500 rounded-sm border-2 flex flex-col justify-center items-center relative">
        <span className="absolute hidden transition duration-500 group-hover:block text-highlight-magenta-400 top-2 right-2">undo</span>
        <CheckCircleIcon className="size-8" />
    </div>
    return <div 
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onClick={() => uploadRef.current?.click()} 
     className="size-full group cursor-pointer hover:border-solid border-primary-50 text-primary-500/20 hover:text-primary-800 hover:border-primary-50/20 hover:bg-primary-500/20 transition duration-500 rounded-sm border-2 border-dashed flex flex-col justify-center items-center">
        <CloudArrowUpIcon className="size-8" />
        File Drop
        <input  accept="application/pdf" onChange={handleChange} ref={uploadRef}  className="hidden" type="file" />
    </div>
}