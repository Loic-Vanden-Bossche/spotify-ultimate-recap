import { useEffect, useState } from "react";
import eventBus from "../utils/eventBus.ts";

export default () => {
  const [status, setStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const onStart = (data: { fileName: string }) => {
      setFileName(data.fileName);
      setStatus("Uploading started...");
    };

    const onProgress = (data: { status: string }) => {
      setStatus(data.status);
    };

    const onComplete = () => {
      setStatus("Processing complete!");
    };

    const onError = (data: { error: string }) => {
      setStatus(`Error: ${data.error}`);
    };

    // Subscribe to events
    eventBus.on("upload:start", onStart);
    eventBus.on("upload:progress", onProgress);
    eventBus.on("upload:complete", onComplete);
    eventBus.on("upload:error", onError);

    // Cleanup listeners on unmount
    return () => {
      eventBus.off("upload:start", onStart);
      eventBus.off("upload:progress", onProgress);
      eventBus.off("upload:complete", onComplete);
      eventBus.off("upload:error", onError);
    };
  }, []);

  return (
    <div className="upload-status">
      <h3>Upload Status</h3>
      {fileName && <p>File: {fileName}</p>}
      {status && <p>Status: {status}</p>}
    </div>
  );
};
