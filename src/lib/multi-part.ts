import Busboy from "busboy";
import { Readable } from "stream";

interface MultiPartFile {
  fileName: string;
  fileContent: Buffer;
}

export const processMultiPartFile = (
  input: ReadableStream<Uint8Array>,
  contentType: string | null = null,
): Promise<MultiPartFile> => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        "content-type": contentType || "multipart/form-data",
      },
    });

    let fileName = "";
    let fileContent: Buffer | null = null;

    // @ts-expect-error - ReadableStream is not compatible with Readable
    const readable = Readable.fromWeb(input);
    readable.pipe(busboy);

    busboy.on("file", (_, file, info) => {
      fileName = info.filename;
      const chunks: Buffer[] = [];

      file.on("data", (chunk) => {
        chunks.push(chunk);
      });

      file.on("end", () => {
        fileContent = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", async () => {
      if (!fileName || !fileContent) {
        reject(new Error("No file uploaded"));
      } else {
        resolve({ fileName, fileContent });
      }
    });
  });
};
