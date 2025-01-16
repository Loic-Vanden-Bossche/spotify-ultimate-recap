import { type FC, type ReactNode } from "react";

interface AnimatedSwitcherProps {
  first: ReactNode;
  second: ReactNode;
  isFirstActive: boolean;
}

export const AnimatedSwitcher: FC<AnimatedSwitcherProps> = ({
  first,
  second,
  isFirstActive,
}) => {
  return (
    <div className={"h-full w-full relative "}>
      {!isFirstActive && second}
      <div
        className={`absolute pointer-events-none top-0 transition-opacity [transition-timing-function:cubic-bezier(0.32,0,0.67,0)] duration-300 h-full w-full bg-black ${isFirstActive ? "opacity-100" : "opacity-0"}`}
      >
        {first}
      </div>
    </div>
  );
};
