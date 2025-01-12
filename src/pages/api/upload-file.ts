import type { APIRoute } from "astro";
import Busboy from "busboy";
import { Readable } from "stream";
import AdmZip from "adm-zip";

export const prerender = false;

const encodeMessage = (eventName: string, data: any) => {
  return `event: ${eventName}, data: ${JSON.stringify(data)}\n\n`;
};

const isZipFile = (buffer: Buffer) => {
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
};

const extractJsonFromZip = (zipBuffer: Buffer): Record<string, any>[] => {
  const zip = new AdmZip(zipBuffer);
  const jsonFiles: Record<string, any>[] = [];

  // Iterate through ZIP entries
  const entries = zip.getEntries();
  for (const entry of entries) {
    const fileName = entry.entryName;

    // Skip directories
    if (entry.isDirectory) {
      console.log(`Skipping directory: ${fileName}`);
      continue;
    }

    // Only process JSON files
    if (!fileName.toLowerCase().endsWith(".json")) {
      console.log(`Skipping non-JSON file: ${fileName}`);
      continue;
    }

    if (!fileName.toLowerCase().includes("audio")) {
      console.log(`Skipping non-Audio file: ${fileName}`);
      continue;
    }

    try {
      const fileContent = entry.getData().toString("utf-8");
      jsonFiles.push({ filename: fileName, content: JSON.parse(fileContent) });
    } catch (error) {
      console.error(`Error processing JSON file ${fileName}:`, error);
    }
  }

  console.log(`Extracted ${jsonFiles.length} JSON files from ZIP.`);
  return jsonFiles;
};

export const POST: APIRoute = async ({ request }) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const headers = request.headers;
      const busboy = Busboy({
        headers: {
          "content-type": headers.get("content-type") || "multipart/form-data",
        },
      });

      let fileName = "";
      let fileContent: Buffer | null = null;

      const body = request.body;

      if (!body) {
        throw new Error("No body found");
      }

      // @ts-ignore
      const readable = Readable.fromWeb(body);
      readable.pipe(busboy); // Pipe to Busboy

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
        try {
          if (!fileName || !fileContent) {
            throw new Error("No file uploaded");
          }

          controller.enqueue(
            encoder.encode(
              encodeMessage("progress", {
                status: "File upload started",
                fileName,
              }),
            ),
          );

          if (!isZipFile(fileContent)) {
            throw new Error("Uploaded file is not a ZIP archive");
          }

          const jsonFiles = extractJsonFromZip(fileContent);

          if (jsonFiles.length === 0) {
            throw new Error("No JSON files found in the ZIP archive");
          }

          controller.enqueue(
            encoder.encode(
              encodeMessage("progress", {
                status: `${jsonFiles.length} Fichiers de donnés récupérés`,
              }),
            ),
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));

          controller.enqueue(
            encoder.encode(
              encodeMessage("complete", {
                status: "File processing completed successfully!",
              }),
            ),
          );
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              encodeMessage("error", {
                status: "Error",
                message: (err as Error).message,
              }),
            ),
          );
        }

        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
