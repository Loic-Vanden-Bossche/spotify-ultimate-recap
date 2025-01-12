import { useEffect, useState } from "react";
import eventBus from "../utils/eventBus.ts";
import { Loader } from "./Loader.tsx";

export const UploadStatus = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [visible, setVisible] = useState(false); // State to control animation

  useEffect(() => {
    const onStart = (data: { fileName: string }) => {
      setFileName(data.fileName);
      setStatus("Uploading started...");
    };

    const onProgress = (data: { status: string }) => {
      setStatus(data.status);
    };

    const onComplete = () => {
      setVisible(false); // Trigger exit animation
      setTimeout(() => setStatus(null), 300); // Wait for animation to finish before removing
    };

    const onError = (data: { error: string }) => {
      setStatus(`Error: ${data.error}`);
      setVisible(false); // Trigger exit animation
    };

    eventBus.on("upload:start", onStart);
    eventBus.on("upload:progress", onProgress);
    eventBus.on("upload:complete", onComplete);
    eventBus.on("upload:error", onError);

    return () => {
      eventBus.off("upload:start", onStart);
      eventBus.off("upload:progress", onProgress);
      eventBus.off("upload:complete", onComplete);
      eventBus.off("upload:error", onError);
    };
  }, []);

  useEffect(() => {
    if (status) {
      setVisible(true);
    }
  }, [status]);

  return (
    status && (
      <div
        className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Loader size={60} />
        <h1 className="text-2xl">{status}</h1>
      </div>
    )
  );
};
