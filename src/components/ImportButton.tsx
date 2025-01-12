import {
  type ChangeEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import eventBus from "../utils/eventBus.ts";
import { Loader } from "./Loader";

export const ImportButton = () => {
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const onStart = () => {
      setLoading(true);
    };

    const onStop = () => {
      setLoading(false);
    };

    eventBus.on("upload:start", onStart);
    eventBus.on("upload:complete", onStop);
    eventBus.on("upload:error", onStop);

    return () => {
      eventBus.off("upload:start", onStart);
      eventBus.off("upload:complete", onStop);
      eventBus.off("upload:error", onStop);
    };
  }, []);

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
        className={`bg-black text-white px-4 py-2 rounded-md flex items-center justify-center transition-all duration-300 ease-in-out disabled:opacity-80`}
        onClick={handleClick}
        disabled={loading}
      >
        <span
          className={`inline-block h-5 transition-all duration-300 ${
            loading ? "opacity-100 w-5 mr-4" : "opacity-0 w-0 mr-0"
          }`}
        >
          {loading && <Loader />}
        </span>
        <p>Import Spotify Data</p>
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
