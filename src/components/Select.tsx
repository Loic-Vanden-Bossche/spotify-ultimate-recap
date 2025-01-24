import React, { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SelectItem } from "./SelectItem.tsx";

export interface Option {
  value: string;
  stringLabel?: string;
  label: ReactNode;
  disabledReason?: string;
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
        const optionsWithoutDisabled = options.filter((o) => !o.disabledReason);
        const newOptions =
          selectedOptions.length === optionsWithoutDisabled.length
            ? []
            : optionsWithoutDisabled;
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

    const dropdown = dropdownRef?.current?.querySelector("div:nth-child(2)"); // Get the dropdown menu
    if (dropdown) {
      const rect = dropdown.getBoundingClientRect();
      setDefaultBounds(rect);
    }
  }, [options]);

  const isAllSelected =
    selectedOptions.length ===
    options.filter((opt) => !opt.disabledReason).length;

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

  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const [defaultBounds, setDefaultBounds] = useState<DOMRect | null>(null);

  const adjustDropdownPosition = () => {
    if (dropdownRef.current && defaultBounds) {
      const overflowRight = defaultBounds.right > window.innerWidth;

      const maxRight =
        defaultBounds.width - (defaultBounds.right - window.innerWidth);

      let overflowLeft = false;

      const dropdown = dropdownRef?.current?.querySelector("div:nth-child(1)"); // Get the dropdown menu
      if (dropdown) {
        const rect = dropdown.getBoundingClientRect();

        if (rect.right - defaultBounds.width < 0) {
          overflowLeft = true;
        }
      }

      setDropdownStyles({
        ...(overflowRight && { right: 0, left: "auto" }), // Shift left if it overflows right
        ...(overflowLeft && { left: 0 }), // Reset if it overflows left
        ...(overflowLeft &&
          overflowRight && { maxWidth: `calc(${maxRight}px - 1rem)` }),
      });
    }
  };

  useEffect(() => {
    if (isOpen && isAnimating) {
      adjustDropdownPosition();
    }
  }, [isAnimating]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true); // Start
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="h-full relative">
      <div
        className="border h-full border-gray-300 rounded-md bg-white shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center hover:border-gray-400"
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
        style={dropdownStyles}
        className={`absolute mt-2 min-w-full w-max bg-white border border-gray-300 rounded-md shadow-lg z-10 transform transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <ul
          className={`transition-all whitespace-nowrap duration-300 ease-in-out ${!isAnimating && isOpen ? "overflow-y-auto" : "overflow-hidden"} ${
            isOpen ? "max-h-60" : "max-h-0"
          }`}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className={dropdownStyles.maxWidth ? "inline-block" : "w-full"}>
            {multiple && (
              <SelectItem
                key="all"
                option={{ value: "all", label: t("Select All") }}
                isSelected={isAllSelected}
                onSelected={handleOptionClick}
                isMultiple={true}
                disabledOptions={disabledOptions}
              />
            )}
            {options.map((option) => {
              const isSelected = selectedOptions.some(
                (selected) => selected.value === option.value,
              );

              return (
                <SelectItem
                  key={option.value}
                  option={option}
                  isSelected={isSelected}
                  onSelected={handleOptionClick}
                  isMultiple={multiple}
                  disabledOptions={disabledOptions}
                />
              );
            })}
          </div>
        </ul>
      </div>
    </div>
  );
};
