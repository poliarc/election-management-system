interface ModuleStatusBadgeProps {
    isActive?: boolean;
    isDefault?: boolean;
    isDisplay?: boolean;
    type?: 'status' | 'default' | 'display';
}

export function ModuleStatusBadge({
    isActive = false,
    isDefault = false,
    isDisplay = false,
    type = 'status'
}: ModuleStatusBadgeProps) {
    if (type === 'status') {
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    }

    if (type === 'default') {
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isDefault
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                {isDefault ? 'Yes' : 'No'}
            </span>
        );
    }

    if (type === 'display') {
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isDisplay
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                {isDisplay ? 'Yes' : 'No'}
            </span>
        );
    }

    return null;
}