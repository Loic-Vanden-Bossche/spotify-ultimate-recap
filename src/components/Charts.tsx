import { type FC } from "react";
import { HourlyChart } from "./charts/HourlyChart";
import { ArtistsChart } from "./charts/ArtistsChart";
import { DailyChart } from "./charts/DailyChart";
import { TreemapChart } from "./charts/TreemapChart";
import { ChartsSettings } from "./ChartsSettings";
import { ChartContainer } from "./ChartContainer.tsx";

export const Charts: FC = () => {
  return (
    <div className="p-10 flex flex-col gap-10">
      <ChartsSettings
        availableYears={["2017", "2018", "2019", "2020", "2021"]}
      />
      <ChartContainer title="Distribution des heures d'écoute dans une journée">
        <HourlyChart />
      </ChartContainer>

      <ChartContainer title="Top 15 des artistes écoutés">
        <ArtistsChart />
      </ChartContainer>

      <ChartContainer title="Carte des écoutes par jour">
        <DailyChart />
      </ChartContainer>

      <ChartContainer title="Carte interractive des sons écoutés">
        <TreemapChart />
      </ChartContainer>
    </div>
  );
};
