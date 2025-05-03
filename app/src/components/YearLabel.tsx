import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { MetricsContainer } from "./MetricsContainer.tsx";
import type { YearData } from "../models/year-data.ts";

interface HistoryLabelProps {
  year: YearData;
}

export const YearLabel: FC<HistoryLabelProps> = ({ year }) => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const getColorFromRate = (rate: number): string => {
    const red = { r: 255, g: 0, b: 0 };
    const orange = { r: 255, g: 165, b: 0 };
    const green = { r: 0, g: 255, b: 0 };

    let r, g, b;
    if (rate <= 50) {
      const t = rate / 50;
      r = Math.round(red.r * (1 - t) + orange.r * t);
      g = Math.round(red.g * (1 - t) + orange.g * t);
      b = Math.round(red.b * (1 - t) + orange.b * t);
    } else {
      const t = (rate - 50) / 50;
      r = Math.round(orange.r * (1 - t) + green.r * t);
      g = Math.round(orange.g * (1 - t) + green.g * t);
      b = Math.round(orange.b * (1 - t) + green.b * t);
    }

    const blendWithWhite = (color: number) =>
      Math.round(color + (255 - color) * 0.6);

    return `rgb(${blendWithWhite(r)}, ${blendWithWhite(g)}, ${blendWithWhite(b)})`;
  };

  return (
    <div className={"flex items-center gap-2"}>
      <div>{year.year}</div>
      <MetricsContainer>
        <div style={{ backgroundColor: getColorFromRate(year.completionRate) }}>
          {t("Completed", { rate: year.completionRate.toFixed(2) })}
        </div>
      </MetricsContainer>
    </div>
  );
};
