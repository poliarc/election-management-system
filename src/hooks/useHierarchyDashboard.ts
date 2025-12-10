import { useState, useEffect, useMemo } from 'react';
import {
    fetchHierarchyData,
    countByLevelType,
    getChildrenOf,
    type HierarchyItem,
    type AfterAssemblyHierarchyItem
} from '../services/hierarchyApi';

interface DashboardCounts {
    districts: number;
    assemblies: number;
    blocks: number;
    mandals: number;
    pollingCenters: number;
    booths: number;
    // Dynamic counts for different level types
    [key: string]: number;
}

interface UseHierarchyDashboardProps {
    stateId?: number;
    districtId?: number;
    assemblyId?: number;
    partyId?: number;
}

export const useHierarchyDashboard = ({
    stateId,
    districtId,
    assemblyId,
    partyId
}: UseHierarchyDashboardProps) => {
    const [hierarchyData, setHierarchyData] = useState<{
        stateHierarchy: HierarchyItem[];
        afterAssemblyHierarchy: AfterAssemblyHierarchyItem[];
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch hierarchy data
    useEffect(() => {
        const loadHierarchyData = async () => {
            if (!stateId) return;

            setLoading(true);
            setError(null);

            try {
                const data = await fetchHierarchyData(stateId, partyId);
                if (data.success) {
                    // Debug: Log the received data structure
                    console.log('Hierarchy data received:', {
                        stateHierarchy: data.data.stateHierarchy.length,
                        afterAssemblyHierarchy: data.data.afterAssemblyHierarchy.length,
                        stateId,
                        districtId,
                        assemblyId
                    });
                    setHierarchyData(data.data);
                } else {
                    setError(data.message || 'Failed to fetch hierarchy data');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        loadHierarchyData();
    }, [stateId, partyId]);

    // Calculate counts based on current level
    const counts = useMemo((): DashboardCounts => {
        if (!hierarchyData) {
            return {
                districts: 0,
                assemblies: 0,
                blocks: 0,
                mandals: 0,
                pollingCenters: 0,
                booths: 0,
            };
        }

        const { stateHierarchy, afterAssemblyHierarchy } = hierarchyData;

        // Helper function to get dynamic level counts
        const getDynamicLevelCounts = (items: AfterAssemblyHierarchyItem[]) => {
            const levelCounts: { [key: string]: number } = {};

            // Get unique level types from the data
            const uniqueLevels = [...new Set(items.map(item => item.display_level_name || item.levelName))];

            uniqueLevels.forEach(level => {
                const normalizedLevel = level.toLowerCase();
                levelCounts[normalizedLevel] = items.filter(item =>
                    (item.display_level_name || item.levelName) === level
                ).length;
            });

            return levelCounts;
        };

        if (assemblyId) {
            // Assembly level - count direct children and their descendants
            const assembly = stateHierarchy.find(item => item.id === assemblyId);
            const assemblyIdToUse = assembly ? assembly.id : assemblyId;

            // Get direct children of assembly (parentAssemblyId matches and parentId is null)
            const directChildren = afterAssemblyHierarchy.filter(
                item => item.parentAssemblyId === assemblyIdToUse && item.parentId === null
            );

            // Get all descendants (children of direct children)
            let allDescendants: AfterAssemblyHierarchyItem[] = [];

            const getDescendants = (parentIds: number[]): AfterAssemblyHierarchyItem[] => {
                const children = afterAssemblyHierarchy.filter(
                    item => parentIds.includes(item.parentId || 0) && item.parentAssemblyId === null
                );

                if (children.length > 0) {
                    const childIds = children.map(child => child.id);
                    return [...children, ...getDescendants(childIds)];
                }

                return children;
            };

            if (directChildren.length > 0) {
                const directChildIds = directChildren.map(child => child.id);
                allDescendants = getDescendants(directChildIds);
            }

            // Combine direct children and descendants for counting
            const allItems = [...directChildren, ...allDescendants];
            const dynamicCounts = getDynamicLevelCounts(allItems);

            // Debug logging for assembly level
            console.log('Assembly level counts:', {
                assemblyId: assemblyIdToUse,
                directChildren: directChildren.length,
                allDescendants: allDescendants.length,
                dynamicCounts,
                totalAfterAssemblyItems: afterAssemblyHierarchy.length,
                directChildrenLevels: directChildren.map(c => c.display_level_name || c.levelName),
                descendantsLevels: allDescendants.map(c => c.display_level_name || c.levelName)
            });

            return {
                districts: 0,
                assemblies: 1,
                blocks: dynamicCounts.block || 0,
                mandals: dynamicCounts.mandal || 0,
                pollingCenters: dynamicCounts['polling center'] || dynamicCounts.pollingcenter || 0,
                booths: dynamicCounts.booth || 0,
                ...dynamicCounts
            };
        }

        if (districtId) {
            // District level - count assemblies for this district and their children
            const districtAssemblies = getChildrenOf(stateHierarchy, districtId);

            let allAfterAssemblyItems: AfterAssemblyHierarchyItem[] = [];

            districtAssemblies.forEach(assembly => {
                // Get direct children of assembly
                const directChildren = afterAssemblyHierarchy.filter(
                    item => item.parentAssemblyId === assembly.id && item.parentId === null
                );

                // Get all descendants
                const getDescendants = (parentIds: number[]): AfterAssemblyHierarchyItem[] => {
                    const children = afterAssemblyHierarchy.filter(
                        item => parentIds.includes(item.parentId || 0) && item.parentAssemblyId === null
                    );

                    if (children.length > 0) {
                        const childIds = children.map(child => child.id);
                        return [...children, ...getDescendants(childIds)];
                    }

                    return children;
                };

                if (directChildren.length > 0) {
                    const directChildIds = directChildren.map(child => child.id);
                    const descendants = getDescendants(directChildIds);
                    allAfterAssemblyItems = [...allAfterAssemblyItems, ...directChildren, ...descendants];
                }
            });

            const dynamicCounts = getDynamicLevelCounts(allAfterAssemblyItems);

            // Debug logging for district level
            console.log('District level counts:', {
                districtId,
                assemblies: districtAssemblies.length,
                dynamicCounts,
                totalAfterAssemblyItems: afterAssemblyHierarchy.length,
                allAfterAssemblyLevels: allAfterAssemblyItems.map(c => c.display_level_name || c.levelName)
            });

            return {
                districts: 1,
                assemblies: districtAssemblies.length,
                blocks: dynamicCounts.block || 0,
                mandals: dynamicCounts.mandal || 0,
                pollingCenters: dynamicCounts['polling center'] || dynamicCounts.pollingcenter || 0,
                booths: dynamicCounts.booth || 0,
                ...dynamicCounts
            };
        }

        // State level - count all
        const districts = countByLevelType(stateHierarchy, 'District');
        const assemblies = countByLevelType(stateHierarchy, 'Assembly');

        // Get dynamic counts for all after-assembly items
        const dynamicCounts = getDynamicLevelCounts(afterAssemblyHierarchy);

        // Debug logging for state level
        console.log('State level counts:', {
            stateId,
            districts,
            assemblies,
            dynamicCounts,
            totalAfterAssemblyItems: afterAssemblyHierarchy.length,
            allLevels: [...new Set(afterAssemblyHierarchy.map(item => item.display_level_name || item.levelName))]
        });

        return {
            districts,
            assemblies,
            blocks: dynamicCounts.block || 0,
            mandals: dynamicCounts.mandal || 0,
            pollingCenters: dynamicCounts['polling center'] || dynamicCounts.pollingcenter || 0,
            booths: dynamicCounts.booth || 0,
            ...dynamicCounts
        };
    }, [hierarchyData, stateId, districtId, assemblyId]);

    // Get filtered data for current level
    const filteredData = useMemo(() => {
        if (!hierarchyData) return null;

        const { stateHierarchy, afterAssemblyHierarchy } = hierarchyData;

        if (assemblyId) {
            // Return blocks for this assembly
            return {
                stateHierarchy: stateHierarchy.filter(item => item.id === assemblyId),
                afterAssemblyHierarchy: afterAssemblyHierarchy.filter(
                    item => item.parentAssemblyId === assemblyId
                ),
            };
        }

        if (districtId) {
            // Return assemblies for this district
            return {
                stateHierarchy: stateHierarchy.filter(
                    item => item.ParentId === districtId || item.id === districtId
                ),
                afterAssemblyHierarchy: afterAssemblyHierarchy.filter(item => {
                    // Find assemblies in this district
                    const districtAssemblies = getChildrenOf(stateHierarchy, districtId);
                    return districtAssemblies.some(assembly => item.parentAssemblyId === assembly.id);
                }),
            };
        }

        // State level - return all data
        return hierarchyData;
    }, [hierarchyData, stateId, districtId, assemblyId]);

    return {
        hierarchyData: filteredData,
        counts,
        loading,
        error,
        refetch: () => {
            if (stateId) {
                fetchHierarchyData(stateId, partyId).then(data => {
                    if (data.success) {
                        setHierarchyData(data.data);
                    }
                });
            }
        },
    };
};