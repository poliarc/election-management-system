import React, { useState } from 'react';

interface ToggleButtonProps {
    isActive: boolean;
    onToggle: () => Promise<void>;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
    isActive,
    onToggle,
    disabled = false,
    size = 'md',
    className = ''
}) => {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (disabled || loading) return;

        setLoading(true);
        try {
            await onToggle();
        } catch (error) {
            console.error('Toggle failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'w-8 h-4',
        md: 'w-10 h-5',
        lg: 'w-12 h-6'
    };

    const thumbSizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const translateClasses = {
        sm: isActive ? 'translate-x-4' : 'translate-x-0',
        md: isActive ? 'translate-x-5' : 'translate-x-0',
        lg: isActive ? 'translate-x-6' : 'translate-x-0'
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || loading}
            className={`
                relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                ${sizeClasses[size]}
                ${isActive ? 'bg-green-500' : 'bg-gray-300'}
                ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-80'}
                ${className}
            `}
            title={loading ? 'Processing...' : isActive ? 'Click to deactivate' : 'Click to activate'}
        >
            <span
                className={`
                    inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out
                    ${thumbSizeClasses[size]}
                    ${translateClasses[size]}
                    ${loading ? 'animate-pulse' : ''}
                `}
            />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-spin border border-gray-400 border-t-transparent" />
                </div>
            )}
        </button>
    );
};