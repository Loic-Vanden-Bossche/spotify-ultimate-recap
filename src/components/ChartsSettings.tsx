import React, { type FC, useEffect, useState } from "react";
import { MultiSelect } from "./Select.tsx";
import { useSettingsStore } from "./store/settings.store.ts";
import { Switch } from "./Switch.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";
import { Loader } from "./Loader.tsx";
import type { YearData } from "../lib/year-data.ts";
import type { History } from "../lib/history.ts";

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
  const [selectedHistories, setSelectedHistories] = useState<string[]>([]);

  const fetchHistories = async () => {
    const data: History[] = await fetch(`/api/histories`).then((res) =>
      res.json(),
    );

    return data;
  };

  const fetchYears = async (historyIds: string[]) => {
    const data: YearData[] = await fetch(
      `/api/histories/${historyIds.join(";")}/years`,
    ).then((res) => res.json());

    return data;
  };

  // set default settings
  useEffect(() => {
    const qpSelectedHistory = new URLSearchParams(window.location.search).get(
      "h",
    );

    const qpIsCombined = new URLSearchParams(window.location.search).get("c");
    const qpIsProportional = new URLSearchParams(window.location.search).get(
      "p",
    );

    const isCombined = !(qpIsCombined === "false");
    const isProportional = qpIsProportional === "true";

    setIsCombined(isCombined);
    setIsProportional(isProportional);

    fetchHistories().then(async (histories) => {
      setAvailableHistories(histories);
      const selectedHistories = histories
        .filter((history) => qpSelectedHistory?.split(";").includes(history.id))
        .map((history) => history.id);

      const realSelectedHistories = selectedHistories.length
        ? selectedHistories
        : [histories[0].id];

      setSelectedHistories(realSelectedHistories);
    });
  }, []);

  useEffect(() => {
    if (selectedHistories.length) {
      fetchYears(selectedHistories).then((years) => {
        const isSameYears =
          years.every((year) =>
            availableYears.map((year) => year.year).includes(year.year),
          ) && availableYears.length === years.length;

        setAvailableYears(years);

        let realSelectedYears: string[] = [];

        if (!defaultSettings) {
          const qpSelectedYear = new URLSearchParams(
            window.location.search,
          ).get("y");

          const selectedYears = years
            .filter((year) => qpSelectedYear?.split(";").includes(year.year))
            .map((year) => year.year);

          realSelectedYears = selectedYears.length
            ? selectedYears
            : years.map((year) => year.year);

          setDefaultSettings({
            years: realSelectedYears,
            historyIds: selectedHistories,
            isCombined,
            isProportional,
          });
        } else {
          realSelectedYears = isSameYears
            ? settings?.years || []
            : years.map((year) => year.year);

          if (!isSameYears) {
            setDefaultSettings({
              years: realSelectedYears,
              historyIds: selectedHistories,
              isCombined,
              isProportional,
            });
          }
        }

        const allYearsSelected =
          realSelectedYears.length === years.length && years.length > 1;

        if (allYearsSelected) {
          realSelectedYears.push("all");
        }

        setSettings({
          years: realSelectedYears,
          historyIds: selectedHistories,
          isCombined,
          isProportional,
        });
      });
    }
  }, [selectedHistories]);

  useEffect(() => {
    if (settings) {
      const url = new URL(window.location.href);
      const allYearsSelected = settings.years.includes("all");

      if (allYearsSelected) {
        url.searchParams.delete("y");
      } else {
        url.searchParams.set("y", settings.years.join(";"));
      }

      if (
        availableHistories[0].id === settings.historyIds[0] &&
        settings.historyIds.length === 1
      ) {
        url.searchParams.delete("h");
      } else {
        url.searchParams.set("h", settings.historyIds.join(";"));
      }

      if (!settings.isCombined) {
        url.searchParams.set("c", "false");
      } else {
        url.searchParams.delete("c");
      }

      if (settings.isProportional) {
        url.searchParams.set("p", "true");
      } else {
        url.searchParams.delete("p");
      }

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
            className={"flex gap-4 items-center h-full [&>*]:flex-1 flex-wrap"}
          >
            <div className={"flex gap-4 min-w-56 [&>*]:flex-1 [&>*]:min-w-0"}>
              <MultiSelect
                defaultValues={defaultSettings?.historyIds}
                options={availableHistories.map((history) => ({
                  label: history.id,
                  value: history.id,
                }))}
                onChange={(values) => {
                  if (!settings) {
                    return;
                  }

                  setSelectedHistories(values);
                }}
              />
              <MultiSelect
                defaultValues={defaultSettings?.years}
                options={availableYears.map((year) => ({
                  label: year.year,
                  value: year.year,
                }))}
                onChange={(values) => {
                  if (!settings) {
                    return;
                  }

                  const allYearsSelected =
                    availableYears.length === values.length &&
                    values.length > 1;

                  if (allYearsSelected) {
                    values.push("all");
                  }

                  setSettings({
                    ...settings,
                    years: values,
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
