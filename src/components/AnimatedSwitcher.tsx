import React, { useState, useEffect } from "react";

interface AnimatedSwitcherProps {
  first: React.ReactNode;
  second: React.ReactNode;
  isFirstActive: boolean;
}

export const AnimatedSwitcher: React.FC<AnimatedSwitcherProps> = ({
  first,
  second,
  isFirstActive,
}) => {
  const [currentChild, setCurrentChild] = useState<React.ReactNode>(first);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);

    const timeout = setTimeout(() => {
      setCurrentChild(isFirstActive ? first : second);
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [isFirstActive, first, second]);

  return (
    <div
      className={`transition-opacity duration-300 h-full ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      {currentChild}
    </div>
  );
};
