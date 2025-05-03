import { Loader } from "./Loader.tsx";
import { useUploadStatusStore } from "./store/upload-status.store.ts";

export const UploadStatus = () => {
  const { uploadStatus } = useUploadStatusStore();

  return (
    !!uploadStatus && (
      <section
        className={`absolute inset-0 flex flex-col items-center justify-center bg-black transition-all duration-300 ${
          uploadStatus.message ? "bg-opacity-90" : "bg-opacity-0"
        }`}
      >
        <div
          className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${
            uploadStatus.message ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`transition-all ${uploadStatus.isLoading ? "opacity-100 h-24" : "opacity-0 h-0"}`}
          >
            {uploadStatus.isLoading && <Loader size={80} />}
          </div>
          <h1
            className={`text-2xl mt-7 ${uploadStatus.isError ? "text-red-500" : "text-white"}`}
          >
            {uploadStatus.message}
          </h1>
        </div>
      </section>
    )
  );
};
