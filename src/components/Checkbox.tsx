import React, { type JSX, type ReactNode } from "react";

interface CheckboxProps {
  label: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  icon?: JSX.Element;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked = false,
  onChange,
  icon,
}) => {
  const handleToggle = () => {
    onChange?.(!checked);
  };

  return (
    <div className="flex items-center cursor-pointer" onClick={handleToggle}>
      <div className="relative w-6 h-6 border-2 border-gray-300 rounded-md flex items-center justify-center transition-colors duration-300 group-hover:border-gray-500 group-focus:border-gray-500">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleToggle}
          className="absolute opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className={`transition-transform duration-300 ${
            checked ? "scale-100 text-blue-500" : "scale-0 text-transparent"
          }`}
        >
          {icon || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
        {label}
      </span>
    </div>
  );
};
