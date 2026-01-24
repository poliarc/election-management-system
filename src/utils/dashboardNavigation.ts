// Dynamic navigation mapping for dashboard cards
export const getDashboardNavigation = (title: string, levelType: 'State' | 'District' | 'Assembly'): string | null => {
    const normalizedTitle = title.toLowerCase().replace(/\s+/g, '');

    // Base path mapping based on level type
    const basePaths = {
        State: '/state',
        District: '/district',
        Assembly: '/assembly'
    };

    const basePath = basePaths[levelType];

    // Fixed hierarchy levels (State → District → Assembly)
    const fixedNavigationMap: Record<string, string> = {
        // State level navigation - these are fixed routes
        'districts': `${basePath}/districts`,
        'assemblies': `${basePath}/assembly`,
    };

    // Check fixed mapping first
    if (fixedNavigationMap[normalizedTitle]) {
        return fixedNavigationMap[normalizedTitle];
    }

    // Handle variations and plurals for fixed levels
    const fixedVariations: Record<string, string[]> = {
        'assemblies': ['assembly', 'assemblies'],
        'districts': ['district', 'districts'],
    };

    // Find matching fixed variation
    for (const [key, variants] of Object.entries(fixedVariations)) {
        if (variants.some(variant => normalizedTitle.includes(variant))) {
            return fixedNavigationMap[key];
        }
    }

    // For dynamic levels after Assembly (Block, Ward, Zone, Sector, Mandal, PollingCenter, Booth, etc.)
    // Use the new dynamic-level route structure
    const dynamicLevels = [
        'blocks', 'block',
        'mandals', 'mandal',
        'sectors', 'sector',
        'zones', 'zone',
        'wards', 'ward',
        'booths', 'booth',
        'pollingcenters', 'pollingcenter', 'polling-center', 'polling-centers'
    ];

    // Check if this is a dynamic level
    const isDynamicLevel = dynamicLevels.some(level => normalizedTitle.includes(level));

    if (isDynamicLevel) {
        // Extract the level name (remove 's' if plural)
        let levelName = normalizedTitle;

        // Handle specific cases
        if (normalizedTitle.includes('polling')) {
            levelName = 'pollingcenter';
        } else if (normalizedTitle.endsWith('s') && !normalizedTitle.endsWith('ss')) {
            levelName = normalizedTitle.slice(0, -1);
        }

        // Capitalize first letter for the route
        const capitalizedLevel = levelName.charAt(0).toUpperCase() + levelName.slice(1);

        return `${basePath}/dynamic-level/${capitalizedLevel}`;
    }

    // For any other unknown levels, try to create a dynamic route
    // This handles new levels that might be added in the future
    const singularTitle = normalizedTitle.endsWith('s') && !normalizedTitle.endsWith('ss')
        ? normalizedTitle.slice(0, -1)
        : normalizedTitle;

    const capitalizedTitle = singularTitle.charAt(0).toUpperCase() + singularTitle.slice(1);

    return `${basePath}/dynamic-level/${capitalizedTitle}`;
};

// Get appropriate icon type for any card title
export const getDynamicIconType = (title: string): string => {
    const normalizedTitle = title.toLowerCase();

    // Icon mapping for different hierarchy levels
    if (normalizedTitle.includes('district')) {
        return 'building';
    }

    if (normalizedTitle.includes('assembl')) {
        return 'government';
    }

    if (normalizedTitle.includes('block')) {
        return 'grid';
    }

    if (normalizedTitle.includes('mandal')) {
        return 'users';
    }

    if (normalizedTitle.includes('sector')) {
        return 'chart';
    }

    if (normalizedTitle.includes('zone')) {
        return 'map';
    }

    if (normalizedTitle.includes('ward')) {
        return 'filter';
    }

    if (normalizedTitle.includes('polling') || normalizedTitle.includes('center')) {
        return 'office';
    }

    if (normalizedTitle.includes('booth')) {
        return 'clipboard';
    }

    // Default icon for unknown types
    return 'grid';
};

// Get SVG path data for icon types
export const getIconSvgPath = (iconType: string): string => {
    const iconPaths: Record<string, string> = {
        building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        government: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11",
        grid: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
        users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
        filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
        office: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    };

    return iconPaths[iconType] || iconPaths.grid;
};

// Generate dynamic colors for cards - no longer using API colors
export const getDynamicCardColor = (index: number): { bg: string; text: string } => {
    const colors = [
        { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-blue-100' },
        { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-purple-100' },
        { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-indigo-100' },
        { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-green-100' },
        { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', text: 'text-teal-100' },
        { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', text: 'text-cyan-100' },
        { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', text: 'text-emerald-100' },
        { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', text: 'text-pink-100' },
        { bg: 'bg-gradient-to-br from-rose-500 to-rose-600', text: 'text-rose-100' },
        { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', text: 'text-orange-100' },
        { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', text: 'text-amber-100' },
        { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', text: 'text-yellow-100' },
        { bg: 'bg-gradient-to-br from-lime-500 to-lime-600', text: 'text-lime-100' },
        { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', text: 'text-violet-100' },
        { bg: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600', text: 'text-fuchsia-100' },
        { bg: 'bg-gradient-to-br from-sky-500 to-sky-600', text: 'text-sky-100' },
    ];

    return colors[index % colors.length];
};