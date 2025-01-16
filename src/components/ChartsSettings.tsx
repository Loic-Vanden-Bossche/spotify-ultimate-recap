import { type FC, useEffect, useState } from "react";
import { Select } from "./Select.tsx";
import { useSettingsStore } from "./store/settings.store.ts";
import type { History } from "../lib/history.ts";
import type { YearData } from "../lib/year-data.ts";

export interface ChartsSettingsData {
  year: string;
  historyId: string;
  isCombined: boolean;
}

export const ChartsSettings: FC = () => {
  const [defaultSettings, setDefaultSettings] =
    useState<ChartsSettingsData | null>(null);

  const [availableHistories, setAvailableHistories] = useState<History[]>([]);
  const [availableYears, setAvailableYears] = useState<YearData[]>([]);

  const { setSettings, settings } = useSettingsStore((state) => state);

  const [isCombined, setIsCombined] = useState<boolean>(true);

  const fetchHistories = async () => {
    const data: History[] = await fetch(`/api/histories`).then((res) =>
      res.json(),
    );

    return data;
  };

  const fetchYears = async (historyId: string) => {
    const data: YearData[] = await fetch(
      `/api/histories/${historyId}/years`,
    ).then((res) => res.json());

    return data;
  };

  // set default settings
  useEffect(() => {
    const qpSelectedHistory = new URLSearchParams(window.location.search).get(
      "h",
    );

    const qpSelectedYear = new URLSearchParams(window.location.search).get("y");

    const qpIsCombined = new URLSearchParams(window.location.search).get("c");

    fetchHistories().then(async (histories) => {
      setAvailableHistories(histories);
      const selectedHistory =
        histories.find((history) => history.id === qpSelectedHistory) ||
        histories[0];

      const years = await fetchYears(selectedHistory.id);
      const selectedYear =
        years.find((year) => year.year === qpSelectedYear) || years[0];
      const isCombined = !(qpIsCombined === "false");

      setAvailableYears(years);
      setDefaultSettings({
        year: selectedYear.year,
        historyId: selectedHistory.id,
        isCombined,
      });
      setIsCombined(isCombined);
      setSettings({
        year: selectedYear.year,
        historyId: selectedHistory.id,
        isCombined,
      });
    });
  }, []);

  // on settings changed, set query params

  useEffect(() => {
    if (settings) {
      const url = new URL(window.location.href);
      url.searchParams.set("y", settings.year);
      url.searchParams.set("h", settings.historyId);
      url.searchParams.set("c", settings.isCombined ? "true" : "false");
      window.history.pushState({}, "", url.toString());
    }
  }, [settings]);

  return (
    <section className={"bg-black rounded-2xl p-6 flex gap-2"}>
      {defaultSettings && (
        <>
          <Select
            defaultValue={defaultSettings?.historyId}
            options={availableHistories.map((history) => ({
              label: history.id,
              value: history.id,
            }))}
            onChange={(value) => {
              console.log(settings, value);
              if (!settings) {
                return;
              }

              setSettings({
                ...settings,
                historyId: value,
              });
            }}
          />
          <Select
            defaultValue={defaultSettings?.year}
            options={availableYears.map((year) => ({
              label: year.year,
              value: year.year,
            }))}
            onChange={(value) => {
              if (!settings) {
                return;
              }

              setSettings({
                ...settings,
                year: value,
              });
            }}
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isCombined}
              onChange={(e) => {
                if (!settings) {
                  return;
                }

                setIsCombined(e.target.checked);

                setSettings({
                  ...settings,
                  isCombined: e.target.checked,
                });
              }}
            />
            <span className="ml-2">Combined</span>
          </label>
        </>
      )}
    </section>
  );
};
