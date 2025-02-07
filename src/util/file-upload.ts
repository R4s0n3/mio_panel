import { randomUUID } from "crypto";

export default async function uploadFile (file:string): Promise<string> {
    let fileBuffer: Buffer = Buffer.alloc(0);
    const extensionMatch = /^data:image\/(\w+);base64,/.exec(file);
    const fileExtension: string | undefined = extensionMatch?.[1];


    fileBuffer = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), 'base64');
 

  
    const filename = `${randomUUID()}.${fileExtension}`;

    return filename;
  };