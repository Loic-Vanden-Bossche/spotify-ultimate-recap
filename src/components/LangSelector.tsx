import { useTranslation } from "react-i18next";
import type { ChangeEvent } from "react";

import React from "react";

export const LangSelector = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select
      className="text-sm bg-black text-white rounded-md px-3 py-2"
      onChange={handleChange}
      value={i18n.language}
    >
      <option value="en">{t("English")}</option>
      <option value="fr">{t("French")}</option>
    </select>
  );
};
