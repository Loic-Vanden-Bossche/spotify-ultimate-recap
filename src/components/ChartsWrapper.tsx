import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HourlyChart } from "./charts/HourlyChart";
import { ArtistsChart } from "./charts/ArtistsChart";
import { DailyChart } from "./charts/DailyChart";
import { TreemapChart } from "./charts/TreemapChart";
import { ChartsSettings } from "./ChartsSettings";
import { ImportButton } from "./ImportButton.tsx";
import { useUploadStatusStore } from "./store/upload-status.store.ts";
import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

interface ReactChartsWrapper {
  noData: boolean;
  sharedChart: SharedChartFullData | null;
}

export const ChartsWrapper: FC<ReactChartsWrapper> = ({
  noData,
  sharedChart,
}) => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const [showCharts, setShowCharts] = useState(!noData);
  const uploadStatus = useUploadStatusStore((state) => state.uploadStatus);

  useEffect(() => {
    if (uploadStatus?.status === "complete") {
      setShowCharts(true);
    }
  }, [uploadStatus]);

  if (!showCharts) {
    return (
      !uploadStatus && (
        <div className="flex items-center h-full justify-center flex-col">
          <p className="mb-8 px-10 text-base max-w-[35rem] text-center">
            {t(
              "No data has been imported. Please upload your Spotify data to view your recap!",
            )}
          </p>
          <ImportButton />
        </div>
      )
    );
  }

  return (
    <div className="p-10 max-sm:p-3 flex flex-col gap-10 max-sm:gap-3 overflow-hidden">
      <ChartsSettings sharedChart={sharedChart} />
      <ArtistsChart />
      <HourlyChart />
      <DailyChart />
      <TreemapChart />
    </div>
  );
};
