import type { FC, ReactNode } from "react";

interface MetricsContainerProps {
  children: ReactNode;
}

export const MetricsContainer: FC<MetricsContainerProps> = ({ children }) => {
  return (
    <div
      className={
        "flex items-center gap-1 [&>*]:py-[0.08rem] [&>*]:px-1 [&>*]:rounded [&>*]:text-xs [&>*]:whitespace-nowrap"
      }
    >
      {children}
    </div>
  );
};
