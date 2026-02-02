import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Settings, RefreshCw, Edit2, Save, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../../store/hooks';
import {
    fetchAfterAssemblyHierarchy,
    updateAfterAssemblyData,
    type HierarchyNode,
    type AssemblyHierarchy,
} from '../../../services/afterAssemblyApi';
import SearchableSelect from '../../../components/SearchableSelect';

interface EditingNode {
    id: number;
    newParentId: number | null;
    newParentAssemblyId: number | null;
    targetType: 'assembly' | 'node';
    targetName: string;
    selectedLevel: string | null;
    availableLevels: string[];
}

export default function SimpleHierarchyManager() {
    const { user } = useAppSelector((state) => state.auth);
    const [hierarchyData, setHierarchyData] = useState<AssemblyHierarchy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState<number | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

    const loadHierarchyData = useCallback(async () => {
        try {
            setLoading(true);
            const stateId = user?.state_id || 1;
            const partyId = user?.partyId || 1;
            const response = await fetchAfterAssemblyHierarchy(stateId, partyId);
            if (response.success) {
                setHierarchyData(response.data);
            } else {
                toast.error(response.message || 'Failed to load hierarchy data');
            }
        } catch (error) {
            console.error('Failed to load hierarchy data:', error);
            toast.error('Failed to load hierarchy data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user?.state_id, user?.partyId]);

    useEffect(() => {
        loadHierarchyData();
    }, [loadHierarchyData]);

    // Simple search function - filter assemblies by name
    const getFilteredAssemblies = () => {
        if (!searchTerm) {
            return selectedAssembly ? hierarchyData.filter(a => a.assembly.id === selectedAssembly) : hierarchyData;
        }

        // Search for assemblies that match the search term
        return hierarchyData.filter(assembly =>
            assembly.assembly.levelName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const getAllNodes = (): HierarchyNode[] => {
        const nodes: HierarchyNode[] = [];
        const collectNodes = (nodeList: HierarchyNode[]) => {
            nodeList.forEach(node => {
                nodes.push(node);
                if (node.children) {
                    collectNodes(node.children);
                }
            });
        };

        hierarchyData.forEach(assembly => {
            collectNodes(assembly.afterAssemblyHierarchy);
        });

        return nodes;
    };

    const getAvailableTargets = (currentNodeId: number) => {
        const allNodes = getAllNodes();
        const assemblies = hierarchyData.map(a => a.assembly);

        // Filter out the current node and its descendants to prevent circular references
        const isDescendant = (nodeId: number, targetId: number): boolean => {
            const node = allNodes.find(n => n.id === nodeId);
            if (!node || !node.children) return false;

            return node.children.some(child =>
                child.id === targetId || isDescendant(child.id, targetId)
            );
        };

        const availableNodes = allNodes.filter(node =>
            node.id !== currentNodeId && !isDescendant(currentNodeId, node.id)
        );

        return { assemblies, nodes: availableNodes };
    };

    // Get unique levels from all nodes
    const getAvailableLevels = () => {
        const allNodes = getAllNodes();
        const levels = [...new Set(allNodes.map(node => node.levelName))];
        return levels.sort();
    };

    // Get nodes filtered by level
    const getNodesByLevel = (levelName: string, currentNodeId: number) => {
        const allNodes = getAllNodes();
        return allNodes.filter(node =>
            node.levelName === levelName &&
            node.id !== currentNodeId &&
            !isDescendantOf(currentNodeId, node.id)
        );
    };

    // Helper function to check if a node is descendant of another
    const isDescendantOf = (ancestorId: number, nodeId: number): boolean => {
        const allNodes = getAllNodes();
        const ancestor = allNodes.find(n => n.id === ancestorId);
        if (!ancestor || !ancestor.children) return false;

        return ancestor.children.some(child =>
            child.id === nodeId || isDescendantOf(ancestorId, child.id)
        );
    };

    const handleEditHierarchy = (node: HierarchyNode) => {
        const availableLevels = getAvailableLevels();
        setEditingNode({
            id: node.id,
            newParentId: node.parentId,
            newParentAssemblyId: node.parentAssemblyId,
            targetType: node.parentAssemblyId ? 'assembly' : 'node',
            targetName: node.parentAssemblyId
                ? hierarchyData.find(a => a.assembly.id === node.parentAssemblyId)?.assembly.levelName || ''
                : getAllNodes().find(n => n.id === node.parentId)?.displayName || '',
            selectedLevel: null,
            availableLevels: availableLevels
        });
    };

    const handleSaveHierarchy = async () => {
        if (!editingNode) return;

        try {
            setIsUpdating(true);

            let updatePayload: Record<string, unknown> = {};

            if (editingNode.targetType === 'assembly') {
                // Moving to assembly level - only set parentAssemblyId
                updatePayload = {
                    parentAssemblyId: editingNode.newParentAssemblyId
                };
            } else {
                // Moving under another node - only set parentId  
                updatePayload = {
                    parentId: editingNode.newParentId
                };
            }

            const response = await updateAfterAssemblyData(editingNode.id, updatePayload);

            if (response.success) {
                toast.success(`✅ Hierarchy updated successfully`);
                await loadHierarchyData();
                setEditingNode(null);
            } else {
                toast.error('❌ Failed to update: ' + (response.message || 'Unknown error'));
            }
        } catch (error: unknown) {
            console.error('Update failed:', error);
            toast.error(`❌ Failed to update hierarchy`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingNode(null);
    };

    const toggleNodeExpansion = (nodeId: number) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const getLevelColor = (levelName: string) => {
        const colors = {
            Block: 'from-blue-500 to-blue-600',
            Mandal: 'from-green-500 to-green-600',
            Sector: 'from-purple-500 to-purple-600',
            Zone: 'from-orange-500 to-orange-600',
            Ward: 'from-pink-500 to-pink-600',
            PollingCenter: 'from-indigo-500 to-indigo-600',
            Booth: 'from-red-500 to-red-600',
        };
        return colors[levelName as keyof typeof colors] || 'from-gray-500 to-gray-600';
    };

    const renderNode = (node: HierarchyNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isEditing = editingNode?.id === node.id;

        return (
            <div key={node.id} className="space-y-2">
                <div
                    className={`bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all ${level > 0 ? 'ml-3 sm:ml-6' : ''}`}
                    style={{ marginLeft: level > 0 ? `${level * 12}px` : '0' }}
                >
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                        {hasChildren && (
                            <button
                                onClick={() => toggleNodeExpansion(node.id)}
                                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0 mt-0.5 sm:mt-0"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                )}
                            </button>
                        )}
                        {!hasChildren && <div className="w-5 sm:w-6 flex-shrink-0" />}

                        <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${getLevelColor(node.levelName)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs sm:text-sm font-bold">
                                {node.levelName.charAt(0)}
                            </span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{node.displayName}</h4>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{node.levelName} • ID: {node.id}</p>
                            {node.parentId && (
                                <p className="text-xs text-blue-600 truncate">
                                    Child of: {getAllNodes().find(n => n.id === node.parentId)?.displayName}
                                </p>
                            )}
                            {node.parentAssemblyId && (
                                <p className="text-xs text-green-600 truncate">
                                    Assembly: {hierarchyData.find(a => a.assembly.id === node.parentAssemblyId)?.assembly.levelName}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            {hasChildren && (
                                <div className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium whitespace-nowrap">
                                    {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
                                </div>
                            )}

                            <button
                                onClick={() => handleEditHierarchy(node)}
                                disabled={isUpdating || isEditing}
                                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                <Edit2 className="w-3 h-3" />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        </div>
                    </div>

                    {/* Edit Form */}
                    {isEditing && (
                        <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border">
                            <h5 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Change Hierarchy for: {node.displayName}</h5>

                            <div className="space-y-4">
                                {/* Target Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Move to:
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="targetType"
                                                value="assembly"
                                                checked={editingNode.targetType === 'assembly'}
                                                onChange={(e) => setEditingNode({
                                                    ...editingNode,
                                                    targetType: e.target.value as 'assembly' | 'node',
                                                    newParentId: null,
                                                    newParentAssemblyId: editingNode.newParentAssemblyId,
                                                    selectedLevel: null,
                                                    targetName: ''
                                                })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">Assembly Level</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="targetType"
                                                value="node"
                                                checked={editingNode.targetType === 'node'}
                                                onChange={(e) => setEditingNode({
                                                    ...editingNode,
                                                    targetType: e.target.value as 'assembly' | 'node',
                                                    newParentId: editingNode.newParentId,
                                                    newParentAssemblyId: null,
                                                    selectedLevel: null,
                                                    targetName: ''
                                                })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">Under Another Node</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Target Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {editingNode.targetType === 'assembly' ? 'Select Assembly:' : 'Select Parent Node:'}
                                    </label>

                                    {editingNode.targetType === 'assembly' ? (
                                        <SearchableSelect
                                            options={getAvailableTargets(node.id).assemblies.map(assembly => ({
                                                value: assembly.id,
                                                label: `${assembly.levelName} (Assembly)`,
                                                subtitle: `Assembly ID: ${assembly.id}`
                                            }))}
                                            value={editingNode.newParentAssemblyId}
                                            onChange={(value) => setEditingNode({
                                                ...editingNode,
                                                newParentAssemblyId: value ? Number(value) : null,
                                                targetName: hierarchyData.find(a => a.assembly.id === Number(value))?.assembly.levelName || ''
                                            })}
                                            placeholder="Select an assembly..."
                                            className="w-full"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Level Selection */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Select Level:
                                                </label>
                                                <SearchableSelect
                                                    options={editingNode.availableLevels.map(level => ({
                                                        value: level,
                                                        label: level,
                                                        subtitle: `${getNodesByLevel(level, node.id).length} available nodes`
                                                    }))}
                                                    value={editingNode.selectedLevel}
                                                    onChange={(value) => setEditingNode({
                                                        ...editingNode,
                                                        selectedLevel: value as string,
                                                        newParentId: null,
                                                        targetName: ''
                                                    })}
                                                    placeholder="Select a level first..."
                                                    className="w-full"
                                                />
                                            </div>

                                            {/* Node Selection - Only show if level is selected */}
                                            {editingNode.selectedLevel && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Select {editingNode.selectedLevel}:
                                                    </label>
                                                    <SearchableSelect
                                                        options={getNodesByLevel(editingNode.selectedLevel, node.id).map(targetNode => ({
                                                            value: targetNode.id,
                                                            label: `${targetNode.displayName}`,
                                                            subtitle: `${targetNode.levelName} - ID: ${targetNode.id}`
                                                        }))}
                                                        value={editingNode.newParentId}
                                                        onChange={(value) => {
                                                            const selectedNode = getAllNodes().find(n => n.id === Number(value));
                                                            setEditingNode({
                                                                ...editingNode,
                                                                newParentId: value ? Number(value) : null,
                                                                targetName: selectedNode?.displayName || ''
                                                            });
                                                        }}
                                                        placeholder={`Select a ${editingNode.selectedLevel.toLowerCase()}...`}
                                                        className="w-full"
                                                        maxHeight="max-h-60 sm:max-h-80"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Preview - Only show when a selection is made */}
                                {(editingNode.targetType === 'assembly' && editingNode.newParentAssemblyId) ||
                                    (editingNode.targetType === 'node' && editingNode.selectedLevel) ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm text-gray-600 flex-shrink-0">Will move to:</span>
                                        <ArrowRight className="w-4 h-4 text-blue-500 hidden sm:block flex-shrink-0" />
                                        <span className="font-medium text-blue-700 break-words">
                                            {(() => {
                                                // Show target if something is selected
                                                if (editingNode.targetName) {
                                                    return editingNode.targetType === 'assembly'
                                                        ? `${editingNode.targetName} (Assembly Level)`
                                                        : `${editingNode.targetName} (${editingNode.selectedLevel || 'Node Level'})`;
                                                }

                                                // Show level selection for node type when level is selected but no specific node yet
                                                if (editingNode.targetType === 'node' && editingNode.selectedLevel && !editingNode.targetName) {
                                                    return `${editingNode.selectedLevel} Level (Select specific ${editingNode.selectedLevel.toLowerCase()})`;
                                                }

                                                // Show current location as fallback
                                                if (node.parentAssemblyId) {
                                                    const currentAssembly = hierarchyData.find(a => a.assembly.id === node.parentAssemblyId);
                                                    return `${currentAssembly?.assembly.levelName || 'Unknown Assembly'} (Assembly Level)`;
                                                } else if (node.parentId) {
                                                    const currentParent = getAllNodes().find(n => n.id === node.parentId);
                                                    return `${currentParent?.displayName || 'Unknown Parent'} (${currentParent?.levelName || 'Unknown Level'})`;
                                                } else {
                                                    return 'Root Level';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                ) : null}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={handleSaveHierarchy}
                                        disabled={isUpdating || (
                                            editingNode.targetType === 'assembly'
                                                ? !editingNode.newParentAssemblyId
                                                : !editingNode.newParentId
                                        )}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isUpdating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isUpdating}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div className="space-y-2">
                        {node.children?.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center gap-4 max-w-sm w-full">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-gray-900 font-medium text-sm sm:text-base text-center">Loading hierarchy...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Global loading overlay for updates */}
            {isUpdating && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-2xl flex items-center gap-3 border mx-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-gray-900 font-medium text-sm sm:text-base">Updating hierarchy...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-16">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">Simple Hierarchy Manager</h1>
                                <p className="text-xs text-gray-500 hidden sm:block">Select and change hierarchy easily</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Search */}
                            <div className="relative flex-1 sm:flex-none">
                                <input
                                    type="text"
                                    placeholder="Search assembly..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-48 lg:w-64 pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                                />
                                <div className="absolute left-2.5 sm:left-3 top-2.5">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            <button
                                onClick={loadHierarchyData}
                                disabled={loading || isUpdating}
                                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
                            >
                                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assembly Selector */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <span className="text-sm font-medium text-gray-700 flex-shrink-0">Assemblies:</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 assembly-selector">
                            <button
                                onClick={() => setSelectedAssembly(null)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${selectedAssembly === null
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                All ({hierarchyData.length})
                            </button>
                            {hierarchyData.map((assembly) => (
                                <button
                                    key={assembly.assembly.id}
                                    onClick={() => setSelectedAssembly(assembly.assembly.id)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${selectedAssembly === assembly.assembly.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <span className="hidden sm:inline">{assembly.assembly.levelName}</span>
                                    <span className="sm:hidden">{assembly.assembly.levelName.substring(0, 8)}</span>
                                    <span className="ml-1">({assembly.afterAssemblyHierarchy.length})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                <div className="space-y-4 sm:space-y-6">
                    {(() => {
                        const filteredAssemblies = getFilteredAssemblies();

                        if (filteredAssemblies.length === 0 && searchTerm) {
                            return (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm p-8 sm:p-12 text-center">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl sm:text-2xl">🔍</span>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Assembly Found</h3>
                                    <p className="text-gray-600 text-sm sm:text-base">No assembly matches "{searchTerm}"</p>
                                </div>
                            );
                        }

                        return filteredAssemblies.map((assembly) => (
                            <div key={assembly.assembly.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                                <div className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg sm:text-xl">🏛️</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{assembly.assembly.levelName}</h2>
                                            <p className="text-gray-500 text-sm sm:text-base">
                                                Assembly ID: {assembly.assembly.id} • {assembly.afterAssemblyHierarchy.length} items
                                                {searchTerm && (
                                                    <span className="block sm:inline sm:ml-2 text-blue-600 font-medium">
                                                        • Found matching assembly
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 sm:space-y-3">
                                        {assembly.afterAssemblyHierarchy.map((node) => renderNode(node, 0))}
                                    </div>

                                    {assembly.afterAssemblyHierarchy.length === 0 && (
                                        <div className="text-center py-8 sm:py-12 text-gray-500">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-xl sm:text-2xl">📭</span>
                                            </div>
                                            <p className="text-sm sm:text-base">No items in this assembly</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ));
                    })()}

                    {hierarchyData.length === 0 && !searchTerm && (
                        <div className="text-center py-8 sm:py-12 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl sm:text-2xl">🏛️</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Assemblies Found</h3>
                            <p className="text-gray-500 text-sm sm:text-base">No assembly hierarchy data found for the selected state and party.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}