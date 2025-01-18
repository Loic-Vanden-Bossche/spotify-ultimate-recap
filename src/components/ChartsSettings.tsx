import React, { type FC, useEffect, useState } from "react";
import { MultiSelect } from "./Select.tsx";
import { useSettingsStore } from "./store/settings.store.ts";
import type { History } from "../lib/history.ts";
import type { YearData } from "../lib/year-data.ts";
import { Switch } from "./Switch.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";
import { Loader } from "./Loader.tsx";

export interface ChartsSettingsData {
  years: string[];
  historyIds: string[];
  isCombined: boolean;
  isProportional: boolean;
}

export const ChartsSettings: FC = () => {
  const [defaultSettings, setDefaultSettings] =
    useState<ChartsSettingsData | null>(null);

  const [availableHistories, setAvailableHistories] = useState<History[]>([]);
  const [availableYears, setAvailableYears] = useState<YearData[]>([]);

  const { setSettings, settings } = useSettingsStore((state) => state);

  const [isCombined, setIsCombined] = useState<boolean>(true);
  const [isProportional, setIsProportional] = useState<boolean>(true);

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
    const qpIsProportional = new URLSearchParams(window.location.search).get(
      "p",
    );

    fetchHistories().then(async (histories) => {
      setAvailableHistories(histories);
      const selectedHistories = histories
        .filter((history) => qpSelectedHistory?.split(";").includes(history.id))
        .map((history) => history.id);

      const realSelectedHistories = selectedHistories.length
        ? selectedHistories
        : [histories[0].id];

      const years = await fetchYears(realSelectedHistories[0]);
      const selectedYears = years
        .filter((year) => qpSelectedYear?.split(";").includes(year.year))
        .map((year) => year.year);

      const realSelectedYears = selectedYears.length
        ? selectedYears
        : years.map((year) => year.year);

      const isCombined = !(qpIsCombined === "false");
      const isProportional = !(qpIsProportional === "false");

      setAvailableYears(years);
      setDefaultSettings({
        years: realSelectedYears,
        historyIds: realSelectedHistories,
        isCombined,
        isProportional,
      });
      setIsCombined(isCombined);
      setIsProportional(isProportional);
      setSettings({
        years: realSelectedYears,
        historyIds: realSelectedHistories,
        isCombined,
        isProportional,
      });
    });
  }, []);

  // on settings changed, set query params

  useEffect(() => {
    if (settings) {
      const url = new URL(window.location.href);
      url.searchParams.set("y", settings.years.join(";"));
      url.searchParams.set("h", settings.historyIds.join(";"));
      url.searchParams.set("c", settings.isCombined ? "true" : "false");
      window.history.pushState({}, "", url.toString());
    }
  }, [settings]);

  return (
    <section className="bg-black rounded-2xl p-6">
      <AnimatedSwitcher
        first={
          <div className="h-full w-full flex items-center justify-center">
            <Loader size={30} />
          </div>
        }
        second={
          <div
            className={"flex gap-8 items-center h-full [&>*]:flex-1 flex-wrap"}
          >
            <div className={"flex gap-4 min-w-56 [&>*]:flex-1 [&>*]:min-w-0"}>
              <MultiSelect
                defaultValues={defaultSettings?.historyIds}
                options={availableHistories.map((history) => ({
                  label: history.id,
                  value: history.id,
                }))}
                onChange={(value) => {
                  if (!settings) {
                    return;
                  }

                  setSettings({
                    ...settings,
                    historyIds: value,
                  });
                }}
              />
              <MultiSelect
                defaultValues={defaultSettings?.years}
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
                    years: value,
                  });
                }}
              />
            </div>

            <div className={"flex gap-4 justify-end max-w-full"}>
              <Switch
                checked={isCombined}
                onChange={(checked) => {
                  if (!settings) {
                    return;
                  }

                  setIsCombined(checked);

                  setSettings({
                    ...settings,
                    isCombined: checked,
                  });
                }}
                label="Combiner les annés"
              />
              <Switch
                checked={isProportional}
                onChange={(checked) => {
                  if (!settings) {
                    return;
                  }

                  setIsProportional(checked);

                  setSettings({
                    ...settings,
                    isProportional: checked,
                  });
                }}
                label="Proportionnel"
              />
            </div>
          </div>
        }
        autoHeight={true}
        isFirstActive={!defaultSettings}
      />
    </section>
  );
};
