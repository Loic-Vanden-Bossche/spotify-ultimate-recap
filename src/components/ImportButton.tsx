import { type ChangeEvent, type MouseEvent, useRef } from "react";
import eventBus from "../utils/eventBus.ts";

export const ImportButton = () => {
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);

  const handleClick = (_: MouseEvent<HTMLButtonElement>) => {
    hiddenFileInput.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const fileUploaded = event.target.files[0];
    handleFileUpload(fileUploaded);
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    // Emit event that file upload started
    eventBus.emit("upload:start", { fileName: file.name });

    const response = await fetch("/api/sse", {
      method: "POST",
      body: formData,
    });

    if (!response.body) {
      console.error("Failed to connect to SSE");
      eventBus.emit("upload:error", { error: "Failed to connect to SSE" });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    const processSSE = async () => {
      let remaining = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("SSE Stream closed by the server.");
          eventBus.emit("upload:end");
          break;
        }

        remaining += decoder.decode(value, { stream: true });

        const lines = remaining.split("\n");
        remaining = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: complete")) {
            console.log("File processing complete. Closing SSE.");
            eventBus.emit("upload:complete", {
              message: "Processing complete",
            });
            await reader.cancel();
            return;
          }

          if (line.startsWith("data: ")) {
            const rawData = line.replace("data: ", "").trim();
            try {
              const eventData = JSON.parse(rawData);
              console.log("SSE Message:", eventData);
              eventBus.emit("upload:progress", eventData); // Emit progress updates
            } catch (err) {
              console.error("Error parsing SSE message:", err);
            }
          }
        }
      }
    };

    await processSSE();
  };

  return (
    <>
      <button
        className="bg-black text-white p-2 rounded-md"
        onClick={handleClick}
      >
        Import Spotify Data
      </button>
      <input
        className="hidden"
        type="file"
        onChange={handleChange}
        ref={hiddenFileInput}
      />
    </>
  );
};
