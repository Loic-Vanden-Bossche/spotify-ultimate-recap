import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { MetricsContainer } from "./MetricsContainer.tsx";
import type { History } from "../models/history";

interface HistoryLabelProps {
  history: History;
  isShared: boolean;
  name: string;
}

export const HistoryLabel: FC<HistoryLabelProps> = ({
  history,
  name,
  isShared,
}) => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  return (
    <div className={"flex items-center gap-2"}>
      <div>{name}</div>
      <MetricsContainer>
        <div className={`bg-amber-200`}>
          {t("years", { count: history.yearCount })}
        </div>
        {isShared ? (
          <div className={"bg-green-200"}>
            {t("histories", { count: history.historyCount })}
          </div>
        ) : (
          <div className={"bg-blue-200"}>
            {t("tracks", { count: history.trackCount })}
          </div>
        )}
      </MetricsContainer>
    </div>
  );
};
