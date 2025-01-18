import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Loader } from "./Loader.tsx";
import { UploadIcon } from "./icons/UploadIcon.tsx";
import eventBus from "../utils/eventBus.ts";

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

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const fileUploaded = event.target.files[0];
    handleFileUpload(fileUploaded);

    event.target.value = "";
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    eventBus.emit("upload:start", { fileName: file.name });

    const response = await fetch("/api/upload-file", {
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
          const eventMatch = line.match(/event: ([\w-]+)(.*)/);
          if (!line) continue;

          if (eventMatch) {
            const [, eventName] = eventMatch;

            const dataMatch = line.match(/data: (.*)/);
            const data = dataMatch?.[1];

            switch (eventName) {
              case "complete":
              case "error":
                await reader.cancel();
                break;
            }

            if (data) {
              try {
                eventBus.emit(`upload:${eventName}`, JSON.parse(data));
              } catch (err) {
                console.error("Error parsing SSE message:", err);
              }
            }
          } else {
            console.error("Invalid SSE message: no event");
          }
        }
      }
    };

    await processSSE();
  };

  return (
    <>
      <button
        className={`bg-black text-white px-4 py-2 rounded-md flex items-center justify-center transition-all duration-300 ease-in-out disabled:opacity-80 hover:scale-95 hover:opacity-95`}
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
        <UploadIcon />
        <div className="w-3" />
        <p>Importer les donnéés Spotify</p>
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
