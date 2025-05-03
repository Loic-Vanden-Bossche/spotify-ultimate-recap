import React from "react";
import { Tooltip } from "./Tooltip"; // Adjust the import path accordingly
import { Checkbox } from "./Checkbox";
import type { Option } from "./Select.tsx"; // Assuming you have a Checkbox component

interface SelectItemProps {
  option: Option;
  isSelected: boolean;
  onSelected: (option: Option) => void;
  isMultiple: boolean;
  disabledOptions: boolean;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  option,
  isSelected,
  disabledOptions,
  onSelected,
  isMultiple,
}) => {
  return (
    <li>
      <Tooltip
        content={option.disabledReason} // Pass the tooltip content
        className="rounded shadow-lg px-2 py-1 bg-background text-white text-xs" // Custom styles
        offset={{ x: 0, y: -20 }}
      >
        <div
          className={`group px-4 py-2 cursor-pointer text-gray-700 transition-colors duration-300 ease-in-out hover:bg-gray-100 ${
            isSelected ? "bg-gray-200" : ""
          } ${disabledOptions || option.disabledReason ? "opacity-50 pointer-events-none" : ""}`}
          onClick={() => onSelected(option)}
        >
          {isMultiple ? (
            <Checkbox checked={isSelected} label={option.label} />
          ) : (
            <span className="w-full text-left">{option.label}</span>
          )}
        </div>
      </Tooltip>
    </li>
  );
};
