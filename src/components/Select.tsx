import React, { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "./Checkbox.tsx";

export interface Option {
  value: string;
  stringLabel?: string;
  label: ReactNode;
}

interface SelectProps {
  defaultValues?: string[];
  options: Option[];
  placeholder?: string;
  multiple?: boolean;
  onChange: (values: string[]) => void;
  disabledOptions?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  defaultValues = [],
  options,
  placeholder = "Select options",
  multiple = false,
  onChange,
  disabledOptions = false,
}) => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (option: Option) => {
    if (multiple) {
      if (option.value === "all") {
        const newOptions =
          selectedOptions.length === options.length ? [] : options;
        setSelectedOptions(sortOptions(newOptions));
        onChange(newOptions.map((opt) => opt.value));
        return;
      }

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

      if (updatedOptions.length === options.length) {
        updatedOptions = sortOptions([...updatedOptions]);
      }

      setSelectedOptions(sortOptions(updatedOptions));
      onChange(updatedOptions.map((opt) => opt.value));
    } else {
      const isSelected = selectedOptions.some(
        (selected) => selected.value === option.value,
      );
      const newOptions = isSelected ? [] : [option];
      setSelectedOptions(newOptions);
      onChange(newOptions.map((opt) => opt.value));
      setIsOpen(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  const getLabelFromOption = (option: Option) => {
    return option.stringLabel || option.label;
  };
  const sortOptions = (options: Option[]) => {
    return options.sort((a, b) => {
      if (a.stringLabel && b.stringLabel) {
        return a.stringLabel.localeCompare(b.stringLabel);
      }

      return a.value.localeCompare(b.value);
    });
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
      setSelectedOptions(sortOptions(defaultOptions));
    }
  }, [defaultValues]);

  useEffect(() => {
    if (selectedOptions.length && options.length) {
      setSelectedOptions(
        selectedOptions.map((selected) => {
          return (
            options.find((opt) => opt.value === selected.value) ?? selected
          );
        }),
      );
    }

    const selectedNotInOptions = selectedOptions.some(
      (selected) => !options.some((option) => option.value === selected.value),
    );

    if (selectedNotInOptions) {
      const newSelectedOptions = selectedOptions.filter((selected) =>
        options.some((option) => option.value === selected.value),
      );

      setSelectedOptions(sortOptions(newSelectedOptions));
    }
  }, [options]);

  const isAllSelected = selectedOptions.length === options.length;

  const getSingleSelectLabel = () => {
    if (selectedOptions.length > 0) {
      return getLabelFromOption(selectedOptions[0]);
    }

    if (defaultValues.length > 0) {
      const defaultOption = options.find((option) =>
        defaultValues.includes(option.value),
      );

      return defaultOption ? getLabelFromOption(defaultOption) : placeholder;
    }

    return placeholder;
  };

  const handleTransitionEnd = () => {
    if (isOpen) {
      setIsAnimating(false); // Animation finished
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true); // Start animation
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <div
        className="border border-gray-300 rounded-md bg-white shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center hover:border-gray-400"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-gray-700 text-nowrap overflow-hidden text-ellipsis">
          {multiple
            ? selectedOptions.length > 0
              ? selectedOptions.map((opt) => getLabelFromOption(opt)).join(", ")
              : placeholder
            : getSingleSelectLabel()}
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
        className={`absolute mt-2 min-w-full w-max bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transform transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <ul
          className={`transition-all duration-300 ease-in-out ${!isAnimating && isOpen ? "overflow-auto" : "overflow-hidden"} ${
            isOpen ? "max-h-60" : "max-h-0"
          }`}
          onTransitionEnd={handleTransitionEnd}
        >
          {multiple && (
            <li
              key="all"
              className={`flex items-center group px-4 py-2 cursor-pointer text-gray-700 transition-colors duration-300 ease-in-out hover:bg-gray-100 ${
                isAllSelected ? "bg-gray-200" : ""
              } ${disabledOptions ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => handleOptionClick({ value: "all", label: "" })}
            >
              <Checkbox
                checked={isAllSelected}
                onChange={() =>
                  handleOptionClick({
                    value: "all",
                    label: "",
                  })
                }
                label={t("Select All")}
              />
            </li>
          )}
          {options.map((option) => {
            const isSelected = selectedOptions.some(
              (selected) => selected.value === option.value,
            );

            return (
              <li
                key={option.value}
                className={`flex items-center group px-4 py-2 cursor-pointer text-gray-700 transition-colors duration-300 ease-in-out hover:bg-gray-100 ${
                  isSelected ? "bg-gray-200" : ""
                } ${disabledOptions ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => handleOptionClick(option)}
              >
                {multiple ? (
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleOptionClick(option)}
                    label={option.label}
                  />
                ) : (
                  <span className="w-full text-left">{option.label}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
