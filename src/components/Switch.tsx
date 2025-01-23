import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <div
      className={`flex items-center cursor-pointer select-none min-w-0 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={handleToggle}
    >
      <div
        className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 flex-none ${
          checked ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute left-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </div>

      <span className="ml-3 text-white text-nowrap overflow-hidden text-ellipsis flex-1">
        {label}
      </span>
    </div>
  );
};
