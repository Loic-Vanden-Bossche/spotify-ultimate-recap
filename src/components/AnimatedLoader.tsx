import React from "react";
import { Loader } from "./Loader.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";

interface AnimatedLoaderProps {
  children: React.ReactNode;
  loading: boolean;
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  children,
  loading,
}) => {
  return (
    <AnimatedSwitcher
      first={
        <div className="h-full flex items-center justify-center">
          <Loader size={60} />
        </div>
      }
      second={children}
      isFirstActive={loading}
    />
  );
};
