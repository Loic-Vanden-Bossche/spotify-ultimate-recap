import { useTranslation } from "react-i18next";

import React from "react";
import { type Option, Select } from "./Select.tsx";

export const LangSelector = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const options: Option[] = [
    { value: "en", label: t("English") },
    { value: "fr", label: t("French") },
  ];

  return (
    <div className={i18n.language ? "" : "opacity-0"}>
      {i18n.language && (
        <Select
          defaultValues={[i18n.language]}
          options={options}
          onChange={(values) => {
            i18n.changeLanguage(values[0]);
          }}
        />
      )}
    </div>
  );
};
