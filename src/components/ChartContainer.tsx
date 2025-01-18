import React, { type ReactNode, useEffect, useState } from "react";
import { Switch } from "./Switch.tsx";

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
        const value = qp.get(`${chartId}_${option.key as string}`);

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
  }, []);

  useEffect(() => {
    if (options && onCustomOptionChange) {
      onCustomOptionChange(options);

      const qp = new URLSearchParams(window.location.search);

      customOptions?.forEach((option) => {
        const optionKey = `${chartId}_${option.key as string}`;
        if (options[option.key] !== option.default) {
          qp.set(optionKey, options[option.key] as string);
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${qp}`,
          );
        } else {
          qp.delete(optionKey);
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${qp}`,
          );
        }
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
              const value = options?.[option.key] || option.default;

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
