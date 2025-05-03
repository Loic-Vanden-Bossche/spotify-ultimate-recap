import React, { type ReactNode, useEffect, useState } from "react";
import { Switch } from "./Switch.tsx";
import { useSharedChartStore } from "./store/shared-chart.store.ts";

interface ChartCustomOption<T, K extends keyof T = keyof T> {
  key: keyof T;
  default: T[K];
  label: string;
}

interface ChartContainerProps<T> {
  title: string;
  chartId: string;
  children: ReactNode;
  customOptions?: ChartCustomOption<T>[];
  onCustomOptionChange?: (options: T) => void;
}

export const ChartContainer = <T,>({
  title,
  chartId,
  children,
  customOptions,
  onCustomOptionChange,
}: ChartContainerProps<T>) => {
  const [options, setOptions] = useState<T | null>(null);
  const sharedChart = useSharedChartStore((state) => state.sharedChart);

  const sharedSettings = !sharedChart
    ? []
    : sharedChart.rawQpSettings.split(";").map((setting) => {
        const [key, value] = setting.split("=");

        return {
          key,
          value,
        };
      });

  const getOptionKey = (optionKey: string) => {
    return `cco_${chartId}_${optionKey}`;
  };

  const getSharedSettingOption = (optionKey: string) => {
    return sharedSettings.find((s) => s.key === optionKey)?.value;
  };

  useEffect(() => {
    if (customOptions) {
      const defaultOptions = customOptions.reduce(
        (acc, option) => ({
          ...acc,
          [option.key]: option.default,
        }),
        {} as T,
      );

      const qp = new URLSearchParams(window.location.search);

      customOptions.forEach((option) => {
        const optionKey = getOptionKey(option.key as string);
        const value = qp.get(optionKey) ?? getSharedSettingOption(optionKey);

        if (value) {
          if (typeof defaultOptions[option.key] === "boolean") {
            // @ts-expect-error - we know this is a boolean
            defaultOptions[option.key] = value === "true";
          } else {
            // @ts-expect-error - we know this is string
            defaultOptions[option.key] = value;
          }
        }
      });

      setOptions(defaultOptions);
    }
  }, [sharedChart]);

  useEffect(() => {
    if (options && onCustomOptionChange) {
      onCustomOptionChange(options);

      const qp = new URLSearchParams(window.location.search);

      customOptions?.forEach((option) => {
        const optionKey = getOptionKey(option.key as string);

        const sharedValue = getSharedSettingOption(optionKey);

        if (sharedValue) {
          if (String(options[option.key]) !== sharedValue) {
            qp.set(optionKey, options[option.key] as string);
          } else {
            qp.delete(optionKey);
          }
        } else {
          if (options[option.key] !== option.default) {
            qp.set(optionKey, options[option.key] as string);
          } else {
            qp.delete(optionKey);
          }
        }

        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}?${qp}`,
        );
      });
    }
  }, [options]);

  return (
    <section className="bg-black rounded-2xl p-6">
      <div className={"mb-4 flex items-center gap-4 justify-between flex-wrap"}>
        <h1 className="text-2xl">{title}</h1>
        {customOptions && (
          <div className={"min-w-0"}>
            {customOptions.map((option, i) => {
              const value = options?.[option.key] ?? option.default;

              if (typeof value === "boolean") {
                return (
                  <Switch
                    key={i}
                    checked={value}
                    onChange={(checked) => {
                      if (options) {
                        setOptions({
                          ...options,
                          [option.key]: checked,
                        });
                      }
                    }}
                    label={option.label}
                  />
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
      {children}
    </section>
  );
};
