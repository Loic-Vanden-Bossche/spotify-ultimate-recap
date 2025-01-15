import { type FC, useEffect, useState } from "react";
import { Select } from "./Select.tsx";
import { useSettingsStore } from "./store/settings.store.ts";

export interface ChartsSettingsData {
  year: string;
}

interface ChartsSettingsProps {
  availableYears: string[];
}

export const ChartsSettings: FC<ChartsSettingsProps> = ({ availableYears }) => {
  const [defaultSettings, setDefaultSettings] =
    useState<ChartsSettingsData | null>(null);

  const setSettings = useSettingsStore((state) => state.setSettings);

  // set default settings
  useEffect(() => {
    const defaultSettings = { year: "2017" };
    setDefaultSettings(defaultSettings);

    setSettings(defaultSettings);
  }, []);

  return (
    <div className={"bg-black rounded-2xl p-6"}>
      <Select
        defaultValue={defaultSettings?.year}
        options={[
          { value: "2017", label: "2017" },
          { value: "2018", label: "2018" },
        ]}
        onChange={(value) => {
          setSettings({ year: value });
        }}
      />
    </div>
  );
};
