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

    // Function to build the full hierarchy path for a node
    const getNodeHierarchyPath = (nodeId: number): string => {
        // Find which assembly this node belongs to
        let targetAssembly: AssemblyHierarchy | null = null;
        let targetNode: HierarchyNode | null = null;

        // Search through all assemblies to find the node
        for (const assembly of hierarchyData) {
            const findNodeInAssembly = (nodes: HierarchyNode[]): HierarchyNode | null => {
                for (const node of nodes) {
                    if (node.id === nodeId) {
                        return node;
                    }
                    if (node.children) {
                        const found = findNodeInAssembly(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const found = findNodeInAssembly(assembly.afterAssemblyHierarchy);
            if (found) {
                targetAssembly = assembly;
                targetNode = found;
                break;
            }
        }

        if (!targetAssembly || !targetNode) {
            return 'Unknown';
        }

        // Build the path from assembly to the target node
        const buildPath = (nodes: HierarchyNode[], targetId: number, currentPath: string[] = []): string[] | null => {
            for (const node of nodes) {
                const newPath = [...currentPath, `${node.displayName} (${node.levelName})`];

                if (node.id === targetId) {
                    return newPath;
                }

                if (node.children) {
                    const result = buildPath(node.children, targetId, newPath);
                    if (result) return result;
                }
            }
            return null;
        };

        const path = buildPath(targetAssembly.afterAssemblyHierarchy, nodeId);
        if (path) {
            return `${targetAssembly.assembly.levelName} → ${path.join(' → ')}`;
        }

        return `${targetAssembly.assembly.levelName} → ${targetNode.displayName} (${targetNode.levelName})`;
    };

    const handleEditHierarchy = (node: HierarchyNode) => {
        setEditingNode({
            id: node.id,
            newParentId: node.parentId,
            newParentAssemblyId: node.parentAssemblyId,
            targetType: node.parentAssemblyId ? 'assembly' : 'node',
            targetName: node.parentAssemblyId
                ? hierarchyData.find(a => a.assembly.id === node.parentAssemblyId)?.assembly.levelName || ''
                : getAllNodes().find(n => n.id === node.parentId)?.displayName || ''
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

        // Filter children based on search term
        const filteredChildren = node.children?.filter(child =>
            !searchTerm || child.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];

        // Check if this node matches search or has matching children
        const nodeMatches = !searchTerm || node.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMatchingChildren = filteredChildren.length > 0;

        if (!nodeMatches && !hasMatchingChildren) {
            return null;
        }

        return (
            <div key={node.id} className="space-y-2">
                <div
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    <div className="flex items-center gap-3">
                        {hasChildren && (
                            <button
                                onClick={() => toggleNodeExpansion(node.id)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                            </button>
                        )}
                        {!hasChildren && <div className="w-6" />}

                        <div className={`w-10 h-10 bg-gradient-to-r ${getLevelColor(node.levelName)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-sm font-bold">
                                {node.levelName.charAt(0)}
                            </span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{node.displayName}</h4>
                            <p className="text-sm text-gray-500">{node.levelName} • ID: {node.id}</p>
                            {node.parentId && (
                                <p className="text-xs text-blue-600">
                                    Child of: {getAllNodes().find(n => n.id === node.parentId)?.displayName}
                                </p>
                            )}
                            {node.parentAssemblyId && (
                                <p className="text-xs text-green-600">
                                    Assembly: {hierarchyData.find(a => a.assembly.id === node.parentAssemblyId)?.assembly.levelName}
                                </p>
                            )}
                        </div>

                        {hasChildren && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
                            </div>
                        )}

                        <button
                            onClick={() => handleEditHierarchy(node)}
                            disabled={isUpdating || isEditing}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Edit2 className="w-3 h-3" />
                            Edit
                        </button>
                    </div>

                    {/* Edit Form */}
                    {isEditing && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                            <h5 className="font-medium text-gray-900 mb-3">Change Hierarchy for: {node.displayName}</h5>

                            <div className="space-y-4">
                                {/* Target Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Move to:
                                    </label>
                                    <div className="flex gap-4">
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
                                                    newParentAssemblyId: editingNode.newParentAssemblyId
                                                })}
                                                className="mr-2"
                                            />
                                            Assembly Level
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
                                                    newParentAssemblyId: null
                                                })}
                                                className="mr-2"
                                            />
                                            Under Another Node
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
                                        <SearchableSelect
                                            options={getAvailableTargets(node.id).nodes.map(targetNode => ({
                                                value: targetNode.id,
                                                label: getNodeHierarchyPath(targetNode.id),
                                                subtitle: `Level: ${targetNode.levelName} - ID: ${targetNode.id}`
                                            }))}
                                            value={editingNode.newParentId}
                                            onChange={(value) => setEditingNode({
                                                ...editingNode,
                                                newParentId: value ? Number(value) : null,
                                                targetName: getAllNodes().find(n => n.id === Number(value))?.displayName || ''
                                            })}
                                            placeholder="Select a parent node..."
                                            className="w-full"
                                            maxHeight="max-h-80"
                                        />
                                    )}
                                </div>

                                {/* Preview */}
                                {editingNode.targetName && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Will move to:</span>
                                        <ArrowRight className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium text-blue-700">{editingNode.targetName}</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveHierarchy}
                                        disabled={isUpdating || (!editingNode.newParentId && !editingNode.newParentAssemblyId)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isUpdating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isUpdating}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 transition-colors"
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
                        {filteredChildren.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-8 shadow-lg flex items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-gray-900 font-medium">Loading hierarchy...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Global loading overlay for updates */}
            {isUpdating && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-3 border">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-gray-900 font-medium">Updating hierarchy...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Settings className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Simple Hierarchy Manager</h1>
                                <p className="text-xs text-gray-500">Select and change hierarchy easily</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search nodes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                                />
                                <div className="absolute left-3 top-2.5">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            <button
                                onClick={loadHierarchyData}
                                disabled={loading || isUpdating}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assembly Selector */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
                    <div className="flex items-center gap-4 overflow-x-auto">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Assemblies:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedAssembly(null)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${selectedAssembly === null
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
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${selectedAssembly === assembly.assembly.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {assembly.assembly.levelName} ({assembly.afterAssemblyHierarchy.length})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                <div className="space-y-6">
                    {(selectedAssembly ? hierarchyData.filter(a => a.assembly.id === selectedAssembly) : hierarchyData)
                        .map((assembly) => (
                            <div key={assembly.assembly.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                            <span className="text-white font-bold">🏛️</span>
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-gray-900">{assembly.assembly.levelName}</h2>
                                            <p className="text-gray-500">Assembly ID: {assembly.assembly.id} • {assembly.afterAssemblyHierarchy.length} items</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {assembly.afterAssemblyHierarchy
                                            .filter(node => !searchTerm ||
                                                node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                hasMatchingDescendants(node, searchTerm)
                                            )
                                            .map((node) => renderNode(node, 0))}
                                    </div>

                                    {assembly.afterAssemblyHierarchy.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">📭</span>
                                            </div>
                                            <p>No items in this assembly</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>

                {hierarchyData.length === 0 && (
                    <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏛️</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Assemblies Found</h3>
                        <p className="text-gray-500">No assembly hierarchy data found for the selected state and party.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to check if a node has matching descendants
function hasMatchingDescendants(node: HierarchyNode, searchTerm: string): boolean {
    if (!node.children || !searchTerm) return false;

    return node.children.some(child =>
        child.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hasMatchingDescendants(child, searchTerm)
    );
}