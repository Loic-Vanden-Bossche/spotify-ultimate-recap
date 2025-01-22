import type { FC } from "react";
import type { History } from "../models/history";

interface HistoryLabelProps {
  history: History;
  name: string;
}

export const HistoryLabel: FC<HistoryLabelProps> = ({ history, name }) => {
  return (
    <div className={"flex items-center gap-2"}>
      <div>{name}</div>
      <div>
        {history.yearCount}
        {history.yearCount === 1 ? " year" : " years"}
      </div>
      <div>
        {history.trackCount}
        {history.trackCount === 1 ? " track" : " tracks"}
      </div>
    </div>
  );
};
