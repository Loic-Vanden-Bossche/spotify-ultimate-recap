import { type FC, type ReactNode, useEffect } from "react";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { useSharedChartStore } from "./store/shared-chart.store.ts";
import fr from "../locales/fr.json";
import en from "../locales/en.json";
import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

interface LoadWrapperProps {
  sharedChart: SharedChartFullData | null;
  children: ReactNode;
}

export const LoadWrapper: FC<LoadWrapperProps> = ({
  children,
  sharedChart,
}) => {
  const setSharedChart = useSharedChartStore((state) => state.setSharedChart);

  useEffect(() => {
    if (sharedChart) {
      setSharedChart(sharedChart);
    }

    const languageDetector = new LanguageDetector(null, {
      order: ["cookie", "navigator"],
      lookupCookie: "i18next",
      caches: ["cookie"],
      excludeCacheFor: ["cimode"],
      convertDetectedLanguage: (lng) => {
        const parts = lng.toLowerCase().split("-");
        return parts[0];
      },
    });

    i18n
      .use(languageDetector)
      .use(initReactI18next)
      .init({
        supportedLngs: ["en", "fr"],
        resources: {
          en,
          fr,
        },
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
      });
  }, []);

  return children;
};
