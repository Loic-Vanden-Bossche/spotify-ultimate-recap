import type { APIRoute } from "astro";
import { processMultiPartFile } from "../../lib/multi-part.ts";
import { processImportData } from "../../lib/process-import-data.ts";
import { encodeMessage } from "../../lib/message-utils.ts";
import { extractJsonFromZip, isZipFile } from "../../lib/zip-utils.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const cookies = request.headers.get("cookie");

  if (!cookies) {
    throw new Error("No cookies found");
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    throw new Error("No user UUID found");
  }

  const body = request.body;

  if (!body) {
    throw new Error("No body found");
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start: async (controller) => {
      try {
        const { fileContent, fileName } = await processMultiPartFile(
          body,
          request.headers.get("content-type"),
        );

        controller.enqueue(
          encoder.encode(
            encodeMessage("progress", {
              status: `Fichier ${fileName} envoyé`,
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

        await processImportData(jsonFiles, (status) => {
          controller.enqueue(
            encoder.encode(
              encodeMessage("progress", {
                status,
              }),
            ),
          );
        });

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
