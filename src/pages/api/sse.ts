import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const boundary = request.headers
    .get("content-type")
    ?.match(/boundary=(.*)/)?.[1];
  if (!boundary) {
    return new Response("Invalid form-data", { status: 400 });
  }

  // Use a readable stream to process form-data in chunks
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fileName = "";

      // Parse the FormData manually and process it
      const reader = request.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let remainingData = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        remainingData += new TextDecoder().decode(value);

        // Simulate extracting file name
        const fileNameMatch = remainingData.match(/filename="(.*?)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];

        // Here you'd parse the file content (not shown for simplicity)
        if (remainingData.includes("--" + boundary + "--")) break;
      }

      if (!fileName) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: "No file found"\n\n`),
        );
        controller.close();
        return;
      }

      // Simulate sending events as file processing progresses
      controller.enqueue(
        encoder.encode(
          `event: progress\ndata: ${JSON.stringify({ status: "File upload started", fileName })}\n\n`,
        ),
      );

      // Wait 1 second to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      controller.enqueue(
        encoder.encode(
          `event: progress\ndata: ${JSON.stringify({ status: "File is being processed..." })}\n\n`,
        ),
      );

      // Wait another second to simulate further processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      controller.enqueue(
        encoder.encode(
          `event: complete\ndata: ${JSON.stringify({ status: "File processing completed successfully!" })}\n\n`,
        ),
      );

      // Close the stream to signal processing is complete
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
