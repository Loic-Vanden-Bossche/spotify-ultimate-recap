import React, { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface AnimatedSelectProps {
  defaultValue?: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
}

export const Select: React.FC<AnimatedSelectProps> = ({
  defaultValue,
  options,
  placeholder = "Select an option",
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    onChange(option.value);
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
    if (defaultValue) {
      const defaultOption = options.find(
        (option) => option.value === defaultValue,
      );
      setSelectedOption(defaultOption || null);
    }
  }, [defaultValue]);

  return (
    <div ref={dropdownRef} className="relative w-64">
      <div
        className="border border-gray-300 rounded-md bg-white shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center hover:border-gray-400"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-gray-700">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-500 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
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
        className={`absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ease-in-out transform ${isOpen ? "max-h-60 opacity-100 scale-100" : "max-h-0 opacity-0 scale-95"}`}
        style={{ transitionProperty: "max-height, opacity, transform" }}
      >
        <ul className="max-h-60">
          {options.map((option) => (
            <li
              key={option.value}
              className={`px-4 py-2 cursor-pointer text-gray-700 transition-all duration-300 ease-in-out hover:bg-gray-100 hover:pl-6 ${
                selectedOption?.value === option.value
                  ? "bg-gray-200 font-semibold"
                  : ""
              }`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
