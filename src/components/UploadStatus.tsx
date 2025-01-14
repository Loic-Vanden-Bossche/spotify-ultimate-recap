import { useEffect, useState } from "react";
import eventBus from "../utils/eventBus.ts";
import { Loader } from "./Loader.tsx";

export const UploadStatus = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false); // State to control animation

  useEffect(() => {
    const onStart = () => {
      setIsError(false);
      setLoading(true);
      setStatus("Envoi du fichier en cours...");
    };

    const onProgress = (data: { status: string }) => {
      setStatus(data.status);
    };

    const onComplete = () => {
      setLoading(false);

      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setStatus(null), 300);
      }, 2000);
    };

    const onError = (data: { message: string }) => {
      setIsError(true);
      setLoading(false);
      setStatus(`Erreur: ${data.message}`);

      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setStatus(null), 300);
      }, 2000);
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
      <section
        className={`absolute inset-0 flex flex-col items-center justify-center bg-black transition-all duration-300 ${
          visible ? "bg-opacity-90" : "bg-opacity-0"
        }`}
      >
        <div
          className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {loading && <Loader size={80} />}
          <h1
            className={`text-2xl mt-7 ${isError ? "text-red-500" : "text-white"}`}
          >
            {status}
          </h1>
        </div>
      </section>
    )
  );
};
