import React, { type ReactNode, useEffect, useState } from "react";
import { Switch } from "./Switch.tsx";

interface ChartCustomOption<T, K extends keyof T = keyof T> {
  key: keyof T;
  default: T[K];
  label: string;
}

interface ChartContainerProps<T> {
  title: string;
  children: ReactNode;
  customOptions?: ChartCustomOption<T>[];
  onCustomOptionChange?: (options: T) => void;
}

export const ChartContainer = <T,>({
  title,
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

      setOptions(defaultOptions);
    }
  }, []);

  useEffect(() => {
    if (options && onCustomOptionChange) {
      onCustomOptionChange(options);
    }
  }, [options]);

  return (
    <section className="bg-black rounded-2xl p-6">
      <h1 className="text-2xl mb-4">{title}</h1>
      {customOptions &&
        customOptions.map((option, i) => {
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
      {children}
    </section>
  );
};
