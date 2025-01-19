import { type ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "./Loader.tsx";
import { UploadIcon } from "./icons/UploadIcon.tsx";
import { useUploadStatusStore } from "./store/upload-status.store.ts";
import { wait } from "../lib/time-utils.ts";

export const ImportButton = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const hiddenFileInput = useRef<HTMLInputElement | null>(null);

  const { uploadStatus, setUploadStatus } = useUploadStatusStore(
    (state) => state,
  );

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const fileUploaded = event.target.files[0];
    handleFileUpload(fileUploaded);

    event.target.value = "";
  };

  const processUploadStatus = async (status: string, message: string) => {
    const isError = status === "error";
    const isLoading = status !== "complete";

    const ending = isError || status === "complete";
    const starting = status === "start";

    const newStatus = {
      isError,
      isLoading,
      status,
      message,
    };

    if (starting) {
      setUploadStatus({
        ...newStatus,
        message: "",
        isLoading: false,
      });
      await wait(500);
    }

    setUploadStatus(newStatus);

    if (ending) {
      await wait(2000);
      setUploadStatus({
        ...newStatus,
        message: "",
      });
      await wait(300);
      setUploadStatus(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    processUploadStatus("start", "Envoi du fichier en cours...");

    const response = await fetch("/api/upload-file", {
      method: "POST",
      body: formData,
    });

    if (!response.body) {
      console.error("Failed to connect to SSE");
      processUploadStatus("error", "Failed to connect to SSE");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    const processSSE = async () => {
      let remaining = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
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
                processUploadStatus(eventName, JSON.parse(data).status);
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
        disabled={uploadStatus?.isLoading}
      >
        <span
          className={`inline-block h-5 transition-all duration-300 ${
            uploadStatus?.isLoading
              ? "opacity-100 w-5 mr-4"
              : "opacity-0 w-0 mr-0"
          }`}
        >
          {uploadStatus?.isLoading && <Loader />}
        </span>
        <UploadIcon />
        <div className="w-3" />
        <p>{t("Import Spotify data")}</p>
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
