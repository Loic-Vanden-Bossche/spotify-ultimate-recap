import type { FC, ReactNode } from "react";

interface ChartContainerProps {
  children: ReactNode;
  title: string;
}

export const ChartContainer: FC<ChartContainerProps> = ({
  title,
  children,
}) => {
  return (
    <section className="bg-black rounded-2xl p-6">
      <h1 className="text-2xl mb-4">{title}</h1>
      {children}
    </section>
  );
};
