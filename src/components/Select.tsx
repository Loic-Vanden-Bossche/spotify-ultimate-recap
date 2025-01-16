import React, { useEffect, useRef, useState } from "react";
import { Checkbox } from "./Checkbox";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  defaultValues?: string[];
  options: Option[];
  placeholder?: string;
  onChange: (values: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  defaultValues = [],
  options,
  placeholder = "Select options",
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (option: Option) => {
    const isSelected = selectedOptions.some(
      (selected) => selected.value === option.value,
    );

    let updatedOptions;
    if (isSelected) {
      updatedOptions = selectedOptions.filter(
        (selected) => selected.value !== option.value,
      );
    } else {
      updatedOptions = [...selectedOptions, option];
    }

    setSelectedOptions(updatedOptions);
    onChange(updatedOptions.map((opt) => opt.value));
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (defaultValues.length) {
      const defaultOptions = options.filter((option) =>
        defaultValues.includes(option.value),
      );
      setSelectedOptions(defaultOptions);
    }
  }, [defaultValues]);

  return (
    <div ref={dropdownRef} className="relative">
      <div
        className="border border-gray-300 rounded-md bg-white shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center hover:border-gray-400"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-gray-700 text-nowrap overflow-hidden text-ellipsis">
          {selectedOptions.length > 0
            ? selectedOptions.map((opt) => opt.label).join(", ")
            : placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-500 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      <div
        className={`absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ease-in-out transform ${
          isOpen
            ? "max-h-60 opacity-100 scale-100"
            : "max-h-0 opacity-0 scale-95"
        }`}
        style={{
          transitionProperty: "max-height, opacity, transform",
        }}
      >
        <ul
          className={`overflow-auto transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-60" : "max-h-0"
          }`}
        >
          {options.map((option) => {
            const isSelected = selectedOptions.some(
              (selected) => selected.value === option.value,
            );

            return (
              <li
                key={option.value}
                className={`flex items-center group px-4 py-2 cursor-pointer text-gray-700 transition-all duration-300 ease-in-out hover:bg-gray-100 ${
                  isSelected ? "bg-gray-200" : ""
                }`}
                onClick={() => handleOptionClick(option)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleOptionClick(option)}
                  label={option.label}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
