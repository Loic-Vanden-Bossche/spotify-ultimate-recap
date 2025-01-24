import React, { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "./Select.tsx";
import { useSettingsStore } from "./store/settings.store.ts";
import { Switch } from "./Switch.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";
import { Loader } from "./Loader.tsx";
import { HistoryLabel } from "./HistoryLabel.tsx";
import { YearLabel } from "./YearLabel.tsx";
import type { History } from "../models/history.ts";
import type { YearData } from "../models/year-data.ts";
import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

export interface ChartsSettingsData {
  years: string[];
  historyIds: string[];
  isCombined: boolean;
  isProportional: boolean;
}

interface ChartsSettingsProps {
  sharedChart: SharedChartFullData | null;
}

export const ChartsSettings: FC<ChartsSettingsProps> = ({ sharedChart }) => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const [defaultSettings, setDefaultSettings] =
    useState<ChartsSettingsData | null>(null);

  const [availableHistories, setAvailableHistories] = useState<History[]>([]);
  const [availableYears, setAvailableYears] = useState<YearData[]>([]);

  const { setSettings, settings } = useSettingsStore();

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

  const sharedToHistory = (sharedChart: SharedChartFullData): History => {
    return {
      id: `shared-${sharedChart.id}`,
      yearCount: sharedChart.years.length,
      trackCount: 0,
      historyCount: sharedChart.histories.length,
    };
  };

  const getDefaultSelectedHistories = (
    histories: History[],
    qpSelectedHistory: string | null,
  ) => {
    const selectedHistories = histories
      .filter((history) => qpSelectedHistory?.split(";").includes(history.id))
      .map((history) => history.id);

    if (sharedChart) {
      return [sharedToHistory(sharedChart).id, ...selectedHistories];
    }

    return selectedHistories.length ? selectedHistories : [histories[0].id];
  };

  const getAvailableHistories = (histories: History[]) => {
    if (sharedChart) {
      return [sharedToHistory(sharedChart), ...histories];
    }

    return histories;
  };

  const setDefaultSettingsFromQp = (url: URLSearchParams) => {
    const qpIsCombined = url.get("c");
    const qpIsProportional = url.get("p");

    const isCombined = qpIsCombined !== "false";
    const isProportional = qpIsProportional === "true";

    const applySettings = (combined: boolean, proportional: boolean) => {
      setIsCombined(combined);
      setIsProportional(proportional);
    };

    if (sharedChart) {
      if (sharedChart.isRestricted) {
        applySettings(sharedChart.isCombined, sharedChart.isProportional);
      } else {
        applySettings(
          qpIsCombined === null ? sharedChart.isCombined : isCombined,
          qpIsProportional === null
            ? sharedChart.isProportional
            : isProportional,
        );
      }
    } else {
      applySettings(isCombined, isProportional);
    }
  };

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);

    const qpSelectedHistory = url.get("h");

    setDefaultSettingsFromQp(url);

    fetchHistories().then(async (histories) => {
      setAvailableHistories(getAvailableHistories(histories));
      setSelectedHistories(
        getDefaultSelectedHistories(histories, qpSelectedHistory),
      );
    });
  }, []);

  useEffect(() => {
    if (selectedHistories.length) {
      fetchYears(selectedHistories).then((years) => {
        setAvailableYears(years);

        let realSelectedYears: string[];

        if (!defaultSettings) {
          const url = new URLSearchParams(window.location.search);
          const qpSelectedYear = url.get("y");

          const selectedYears = years
            .filter((year) => qpSelectedYear?.split(";").includes(year.year))
            .map((year) => year.year);

          realSelectedYears = selectedYears.length
            ? selectedYears
            : sharedChart
              ? sharedChart.years.map(String)
              : years.map((year) => year.year);

          setDefaultSettings({
            years: realSelectedYears,
            historyIds: selectedHistories,
            isCombined,
            isProportional,
          });
        } else {
          realSelectedYears = settings?.years || [];

          // const isSameYears =
          //   years.every((year) =>
          //     availableYears.map((year) => year.year).includes(year.year),
          //   ) && availableYears.length === years.length;
          // realSelectedYears = isSameYears
          //   ? settings?.years || []
          //   : years.map((year) => year.year);
          //
          // if (!isSameYears) {
          //   setDefaultSettings({
          //     years: realSelectedYears,
          //     historyIds: selectedHistories,
          //     isCombined,
          //     isProportional,
          //   });
          // }
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

      if (sharedChart) {
        if (sharedChart.isRestricted) {
          url.searchParams.delete("y");
        } else {
          const settingsSelectedYears = settings.years.filter(
            (year) => year !== "all",
          );
          const allYearsSelected =
            sharedChart.years.length === settingsSelectedYears.length &&
            sharedChart.years.every((year) =>
              settingsSelectedYears.includes(String(year)),
            );

          if (allYearsSelected) {
            url.searchParams.delete("y");
          } else {
            url.searchParams.set("y", settingsSelectedYears.join(";"));
          }
        }
      } else {
        const allYearsSelected = settings.years.includes("all");

        if (allYearsSelected) {
          url.searchParams.delete("y");
        } else {
          url.searchParams.set("y", settings.years.join(";"));
        }
      }

      if (
        availableHistories[0].id === settings.historyIds[0] &&
        settings.historyIds.length === 1
      ) {
        url.searchParams.delete("h");
      } else {
        url.searchParams.set(
          "h",
          settings.historyIds
            .filter((id) => !id.startsWith("shared-"))
            .join(";"),
        );
      }

      if (sharedChart) {
        if (
          !sharedChart.isRestricted &&
          sharedChart.isCombined !== settings.isCombined
        ) {
          url.searchParams.set("c", settings.isCombined.toString());
        } else {
          url.searchParams.delete("c");
        }
      } else if (!settings.isCombined) {
        url.searchParams.set("c", "false");
      } else {
        url.searchParams.delete("c");
      }

      if (sharedChart) {
        if (
          !sharedChart.isRestricted &&
          sharedChart.isProportional !== settings.isProportional
        ) {
          url.searchParams.set("p", settings.isProportional.toString());
        } else {
          url.searchParams.delete("p");
        }
      } else if (settings.isProportional) {
        url.searchParams.set("p", "true");
      } else {
        url.searchParams.delete("p");
      }

      window.history.pushState({}, "", url.toString());
    }
  }, [settings]);

  const historyLabel = t("History");

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
              <Select
                multiple={true}
                defaultValues={defaultSettings?.historyIds}
                options={availableHistories.map((history, idx) => {
                  const isShared = history.id.startsWith("shared-");
                  const stringLabel = isShared
                    ? t("Shared chart")
                    : `${historyLabel} ${idx + (sharedChart ? 0 : 1)}`;

                  const isDisabled =
                    sharedChart && sharedChart.histories.includes(history.id);

                  return {
                    label: (
                      <HistoryLabel
                        isShared={isShared}
                        history={history}
                        name={stringLabel}
                      />
                    ),
                    stringLabel,
                    value: history.id,
                    disabledReason: isDisabled
                      ? t("Already selected in shared chart")
                      : undefined,
                  };
                })}
                onChange={(values) => {
                  if (!settings) {
                    return;
                  }

                  setSelectedHistories(values);
                }}
              />
              <Select
                disabledOptions={sharedChart?.isRestricted}
                multiple={true}
                defaultValues={defaultSettings?.years}
                options={availableYears.map((year) => ({
                  label: <YearLabel year={year} />,
                  stringLabel: year.year,
                  disabledReason: sharedChart?.isRestricted
                    ? t("The user does not allow you to change chart settings")
                    : undefined,
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
                disabledMessage={
                  sharedChart?.isRestricted
                    ? t("The user does not allow you to change chart settings")
                    : undefined
                }
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
                label={t("Combined years")}
              />
              <Switch
                disabledMessage={
                  sharedChart?.isRestricted
                    ? t("The user does not allow you to change chart settings")
                    : undefined
                }
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
                label={t("Proportional")}
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
