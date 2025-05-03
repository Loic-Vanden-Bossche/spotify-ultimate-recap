import { create } from "zustand/index";
import type { UploadStatusData } from "../../models/upload-status-data.ts";

type UploadStatusStore = {
  uploadStatus: UploadStatusData | null;
  setUploadStatus: (uploadStatus: UploadStatusData | null) => void;
};

export const useUploadStatusStore = create<UploadStatusStore>((set) => ({
  uploadStatus: null,
  setUploadStatus: (uploadStatus) => set({ uploadStatus }),
}));
