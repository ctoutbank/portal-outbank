"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

interface AutocompleteInputProps {
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function AutocompleteInput({
  suggestions,
  value,
  onChange,
  placeholder,
  onKeyDown,
  className,
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filtrar sugestões no lado do cliente
  const filteredSuggestions = useMemo(() => {
    if (!value || value.trim().length < 1) {
      return [];
    }

    const searchTerm = value.toLowerCase();
    return suggestions
      .filter((suggestion) => suggestion.toLowerCase().includes(searchTerm))
      .slice(0, 10);
  }, [value, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(newValue.trim().length > 0);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDownInternal = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        handleSuggestionClick(filteredSuggestions[selectedIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
    
    // Chamar handler externo se fornecido
    onKeyDown?.(e);
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        suggestionsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDownInternal}
        onFocus={() => {
          if (filteredSuggestions.length > 0 && value.trim().length > 0) {
            setShowSuggestions(true);
          }
        }}
        className={className}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
        >
          <div className="max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={cn(
                  "p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                  selectedIndex === index && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




