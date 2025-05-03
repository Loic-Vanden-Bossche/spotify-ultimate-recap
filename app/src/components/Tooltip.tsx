import React, {
  useState,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  offset?: { x: number; y: number };
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  offset = { x: 0, y: -20 },
  className,
}) => {
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [renderTooltip, setRenderTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipStyle({
      top: rect.top + window.scrollY + offset.y,
      left: rect.left + window.scrollX + offset.x,
    });

    setRenderTooltip(true);
    setTimeout(() => setShowTooltip(true), 10);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    setRenderTooltip(false);
  };

  if (!content) {
    return children;
  }

  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </div>
      {renderTooltip &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`${className} ${
              showTooltip
                ? "opacity-100 translate-y-0 transition-all duration-300"
                : "opacity-0 translate-y-1"
            } fixed z-50 pointer-events-none`}
            style={tooltipStyle}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};
