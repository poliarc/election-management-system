import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
    subtitle?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | null;
    onChange: (value: string | number | null) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
    maxHeight?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    className = '',
    disabled = false,
    maxHeight = 'max-h-60'
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Get selected option
    const selectedOption = options.find(option => option.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    onChange(filteredOptions[highlightedIndex].value);
                    setIsOpen(false);
                    setSearchTerm('');
                    setHighlightedIndex(-1);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleOptionClick = (optionValue: string | number) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Main Select Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
                    w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
                `}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        {selectedOption ? (
                            <div>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {selectedOption.label}
                                </div>
                                {selectedOption.subtitle && (
                                    <div className="text-xs text-gray-500 truncate" title={selectedOption.subtitle}>
                                        {selectedOption.subtitle}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-500 text-sm">{placeholder}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {selectedOption && !disabled && (
                            <button
                                onClick={clearSelection}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Clear selection"
                            >
                                <X className="w-3 h-3 text-gray-400" />
                            </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg ${maxHeight} overflow-hidden`}>
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setHighlightedIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleOptionClick(option.value)}
                                    className={`
                                        w-full px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors
                                        ${index === highlightedIndex ? 'bg-blue-50' : ''}
                                        ${option.value === value ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                                    `}
                                    title={option.subtitle}
                                >
                                    <div className="text-sm font-medium">{option.label}</div>
                                    {option.subtitle && (
                                        <div className="text-xs text-gray-500 break-words mt-1">{option.subtitle}</div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}