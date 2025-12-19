import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    pointerWithin,
    rectIntersection,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import './HierarchyManager.css';
import './HierarchyManagerNew.css';

import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Settings, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../../store/hooks';
import {
    fetchAfterAssemblyHierarchy,
    updateAfterAssemblyData,
} from '../../../services/afterAssemblyApi';
import type { HierarchyNode, AssemblyHierarchy } from '../../../services/afterAssemblyApi';

// Simplified Drop Zone for Grid View
function SimpleDropZone({ targetId, targetType, label, className = "" }: {
    targetId: number | string;
    targetType: 'assembly' | 'node';
    label: string;
    className?: string;
}) {
    const {
        setNodeRef,
        isOver,
    } = useSortable({
        id: `drop-${targetType}-${targetId}`,
        data: { type: targetType, targetId },
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                min-h-[40px] border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center
                ${isOver
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-400 hover:bg-blue-50'
                }
                ${className}
            `}
        >
            <div className="flex items-center gap-2 text-sm font-medium">
                <span>{isOver ? '🎯' : '📥'}</span>
                <span>{isOver ? 'Drop Here!' : label}</span>
            </div>
        </div>
    );
}

// Grid View Component for faster rendering
function GridHierarchyView({ nodes, assembly, searchTerm }: {
    nodes: HierarchyNode[];
    assembly: any;
    searchTerm: string;
}) {
    const filteredNodes = nodes.filter(node =>
        !searchTerm || node.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    return (
        <div className="space-y-3">
            {/* Assembly Drop Zone */}
            <SimpleDropZone
                targetId={assembly.id}
                targetType="assembly"
                label={`Add to ${assembly.levelName}`}
                className="mb-4"
            />

            {/* Nodes */}
            {filteredNodes.map((node) => (
                <CompactNodeCard key={node.id} node={node} getLevelColor={getLevelColor} />
            ))}

            {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No matching items found' : 'No items in this assembly'}
                </div>
            )}
        </div>
    );
}

// Compact Node Card for Grid View
function CompactNodeCard({ node, getLevelColor }: {
    node: HierarchyNode;
    getLevelColor: (levelName: string) => string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({
        id: node.id,
        data: { type: 'node', node },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                group relative bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing
                hover:shadow-md hover:border-gray-300 transition-all duration-200
                ${isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${getLevelColor(node.levelName)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">
                        {node.levelName.charAt(0)}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{node.displayName}</h4>
                    <p className="text-sm text-gray-500">{node.levelName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>ID: {node.id}</span>
                    {node.children && node.children.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                            {node.children.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Children Preview */}
            {node.children && node.children.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                        {node.children.slice(0, 3).map((child) => (
                            <span key={child.id} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                {child.displayName}
                            </span>
                        ))}
                        {node.children.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                +{node.children.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Drop Zone for making children */}
            <div className="mt-3">
                <SimpleDropZone
                    targetId={node.id}
                    targetType="node"
                    label={`Add child to ${node.displayName}`}
                    className="min-h-[32px]"
                />
            </div>
        </div>
    );
}

// Tree Node View for traditional tree layout
function TreeNodeView({ node, level, searchTerm }: { node: HierarchyNode; level: number; searchTerm?: string }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({
        id: node.id,
        data: { type: 'node', node },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        marginLeft: `${level * 24}px`,
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

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="space-y-2">
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={`
                    group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing
                    hover:shadow-md hover:border-gray-300 transition-all duration-200
                    ${isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''}
                `}
            >
                {hasChildren && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
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
                </div>

                {hasChildren && (
                    <div className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                        {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
                    </div>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="space-y-2">
                    <SimpleDropZone
                        targetId={node.id}
                        targetType="node"
                        label={`Add child to ${node.displayName}`}
                        className="ml-9"
                    />
                    {node.children
                        .filter(child => !searchTerm || child.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((child) => (
                            <TreeNodeView key={child.id} node={child} level={level + 1} searchTerm={searchTerm} />
                        ))}
                </div>
            )}

            {!hasChildren && (
                <SimpleDropZone
                    targetId={node.id}
                    targetType="node"
                    label={`Add child to ${node.displayName}`}
                    className="ml-9"
                />
            )}
        </div>
    );
}

export default function HierarchyManager() {
    const { user } = useAppSelector((state) => state.auth);
    const [hierarchyData, setHierarchyData] = useState<AssemblyHierarchy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState<number | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [draggedNode, setDraggedNode] = useState<HierarchyNode | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [viewMode, setViewMode] = useState<'tree' | 'grid'>('grid');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );

    // Simplified collision detection
    const customCollisionDetection = (args: any) => {
        const { pointerCoordinates } = args;

        if (!pointerCoordinates) {
            return rectIntersection(args);
        }

        const pointerCollisions = pointerWithin(args);

        if (pointerCollisions.length === 0) {
            return rectIntersection(args);
        }

        // Prioritize drop zones
        const dropZoneCollisions = pointerCollisions.filter(collision => {
            return typeof collision.id === 'string' && collision.id.startsWith('drop-');
        });

        if (dropZoneCollisions.length > 0) {
            return [dropZoneCollisions[0]];
        }

        return [pointerCollisions[0]];
    };

    useEffect(() => {
        loadHierarchyData();
    }, [user]);

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

    const findNodeById = (nodes: HierarchyNode[], id: number): HierarchyNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const findNodeInHierarchy = (id: number): HierarchyNode | null => {
        for (const assembly of hierarchyData) {
            const found = findNodeById(assembly.afterAssemblyHierarchy, id);
            if (found) return found;
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as number;
        setActiveId(id);
        const node = findNodeInHierarchy(id);
        setDraggedNode(node);
        document.body.classList.add('dragging');
    };

    const handleDragOver = (_event: DragOverEvent) => {
        // Visual feedback can be added here if needed
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setDraggedNode(null);
        document.body.classList.remove('dragging');

        if (!over || active.id === over.id) {
            return;
        }

        const draggedNodeFromHierarchy = findNodeInHierarchy(active.id as number);
        if (!draggedNodeFromHierarchy) {
            return;
        }

        const targetId = over.id;

        // Check if we're dropping on a simplified drop zone
        if (typeof targetId === 'string' && targetId.startsWith('drop-')) {
            const dropData = over.data?.current;
            if (dropData) {
                const { type, targetId: dropTargetId } = dropData;

                if (type === 'assembly') {
                    const targetAssembly = hierarchyData.find(a => a.assembly.id === dropTargetId);
                    if (targetAssembly) {
                        toast.success(`🏛️ Making child of ${targetAssembly.assembly.levelName} Assembly`);
                        await performMove(draggedNodeFromHierarchy, {
                            type: 'assembly',
                            id: targetAssembly.assembly.id,
                            assembly: targetAssembly
                        });
                        return;
                    }
                } else if (type === 'node') {
                    const targetNode = findNodeInHierarchy(dropTargetId);
                    if (targetNode) {
                        // Prevent dropping a parent onto its own child
                        if (isParentOfTarget(draggedNodeFromHierarchy, targetNode.id)) {
                            toast.error('Cannot move parent into its own child');
                            return;
                        }

                        toast.success(`📦 Making child of ${targetNode.displayName}`);
                        await performMove(draggedNodeFromHierarchy, {
                            type: 'node',
                            id: targetNode.id,
                            node: targetNode
                        });
                        return;
                    }
                }
            }
        }

        // Direct node drop
        const targetNode = typeof targetId === 'number' ? findNodeInHierarchy(targetId) : null;
        if (targetNode) {
            if (isParentOfTarget(draggedNodeFromHierarchy, targetNode.id)) {
                toast.error('Cannot move parent into its own child');
                return;
            }

            await performMove(draggedNodeFromHierarchy, { type: 'node', id: targetNode.id, node: targetNode });
            return;
        }
    };

    const isParentOfTarget = (node: HierarchyNode, targetId: number): boolean => {
        if (node.id === targetId) return true;
        return node.children?.some(child => isParentOfTarget(child, targetId)) || false;
    };

    const performMove = async (draggedNode: HierarchyNode, target: { type: 'assembly' | 'node', id: number, assembly?: any, node?: HierarchyNode }) => {
        if (isUpdating) return;

        try {
            setIsUpdating(true);
            let updatePayload: any = {};

            if (target.type === 'assembly') {
                updatePayload = {
                    parentId: null,
                    parentAssemblyId: target.id
                };
            } else {
                updatePayload = {
                    parentId: target.id
                };

                if (draggedNode.parentAssemblyId !== null) {
                    updatePayload.parentAssemblyId = null;
                }
            }

            const response = await updateAfterAssemblyData(draggedNode.id, updatePayload);

            if (response.success) {
                const targetName = target.type === 'assembly'
                    ? target.assembly?.assembly.levelName
                    : target.node?.displayName;

                toast.success(`✅ Moved ${draggedNode.displayName} to ${targetName}`);
                await loadHierarchyData();
            } else {
                toast.error('❌ Failed to update: ' + (response.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Move failed:', error);
            toast.error(`❌ Failed to update hierarchy`);
            await loadHierarchyData();
        } finally {
            setIsUpdating(false);
        }
    };

    const getAllNodeIds = (nodes: HierarchyNode[]): number[] => {
        const ids: number[] = [];
        for (const node of nodes) {
            ids.push(node.id);
            if (node.children) {
                ids.push(...getAllNodeIds(node.children));
            }
        }
        return ids;
    };

    const allNodeIds = useMemo(() => {
        const nodeIds = hierarchyData.flatMap(assembly => getAllNodeIds(assembly.afterAssemblyHierarchy));
        const assemblyIds = hierarchyData.map(assembly => assembly.assembly.id);

        // Add simplified drop zone IDs
        const dropZoneIds: string[] = [];
        hierarchyData.forEach(assembly => {
            dropZoneIds.push(`drop-assembly-${assembly.assembly.id}`);
            const addNodeDropZones = (nodes: HierarchyNode[]) => {
                nodes.forEach(node => {
                    dropZoneIds.push(`drop-node-${node.id}`);
                    if (node.children) {
                        addNodeDropZones(node.children);
                    }
                });
            };
            addNodeDropZones(assembly.afterAssemblyHierarchy);
        });

        return [...nodeIds, ...assemblyIds, ...dropZoneIds];
    }, [hierarchyData]);

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
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
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

                {/* Modern Responsive Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-white/20 top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        {/* Desktop Header */}
                        <div className="hidden lg:flex items-center justify-between h-16">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Settings className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">Hierarchy Manager</h1>
                                    <p className="text-xs text-gray-500">Drag & drop to reorganize</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'tree'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        🌳 Tree
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'grid'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        ⚡ Grid
                                    </button>
                                </div>

                                {/* Search */}
                                {/* <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Quick search..."
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
                                </button> */}
                            </div>
                        </div>

                        {/* Tablet Header */}
                        <div className="hidden md:flex lg:hidden items-center justify-between h-16">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Settings className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold text-gray-900">Hierarchy Manager</h1>
                                    <p className="text-xs text-gray-500">Drag & drop to reorganize</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={`px-2 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'tree'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        🌳
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-2 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'grid'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        ⚡
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-40 pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                                    />
                                    <div className="absolute left-2.5 top-2.5">
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <button
                                    onClick={loadHierarchyData}
                                    disabled={loading || isUpdating}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Header */}
                        <div className="md:hidden py-3 space-y-3">
                            {/* Top Row - Title and Refresh */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <Settings className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-sm font-bold text-gray-900">Hierarchy Manager</h1>
                                        <p className="text-xs text-gray-500">Drag & drop to reorganize</p>
                                    </div>
                                </div>
                                {/* <button
                                    onClick={loadHierarchyData}
                                    disabled={loading || isUpdating}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                </button> */}

                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'tree'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        🌳
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'grid'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        ⚡
                                    </button>
                                </div>
                            </div>

                            {/* Second Row - Search and View Toggle */}
                            <div className="flex items-center gap-2">
                                {/* Search - Full width on mobile */}
                                {/* <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                                    />
                                    <div className="absolute left-2.5 top-2.5">
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div> */}

                                {/* View Mode Toggle - Compact on mobile */}
                                {/* <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'tree'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        🌳
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'grid'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        ⚡
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assembly Selector */}
                <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4 overflow-x-auto w-full">
                                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Assemblies:</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedAssembly(null)}
                                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${selectedAssembly === null
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
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${selectedAssembly === assembly.assembly.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            <span className="hidden sm:inline">{assembly.assembly.levelName}</span>
                                            <span className="sm:hidden">{assembly.assembly.levelName}</span>
                                            <span className="ml-1">({assembly.afterAssemblyHierarchy.length})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Results Indicator */}
                            {searchTerm && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium whitespace-nowrap">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span>Searching: "{searchTerm}"</span>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                    <SortableContext items={allNodeIds} strategy={verticalListSortingStrategy}>
                        {viewMode === 'grid' ? (
                            /* Grid View - Fast and Modern */
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {(selectedAssembly ? hierarchyData.filter(a => a.assembly.id === selectedAssembly) : hierarchyData)
                                    .map((assembly) => (
                                        <div key={assembly.assembly.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
                                            <div className="p-4 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">🏛️</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{assembly.assembly.levelName}</h3>
                                                        <p className="text-sm text-gray-500">Assembly ID: {assembly.assembly.id}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-blue-600">{assembly.afterAssemblyHierarchy.length}</div>
                                                        <div className="text-xs text-gray-500">items</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 max-h-96 overflow-y-auto">
                                                <GridHierarchyView
                                                    nodes={assembly.afterAssemblyHierarchy}
                                                    assembly={assembly.assembly}
                                                    searchTerm={searchTerm}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            /* Tree View - Traditional but Optimized */
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

                                                <SimpleDropZone
                                                    targetId={assembly.assembly.id}
                                                    targetType="assembly"
                                                    label={`Drop here to add to ${assembly.assembly.levelName} Assembly`}
                                                    className="mb-6"
                                                />

                                                <div className="space-y-3">
                                                    {assembly.afterAssemblyHierarchy
                                                        .filter(node => !searchTerm || node.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .map((node) => (
                                                            <TreeNodeView key={node.id} node={node} level={0} searchTerm={searchTerm} />
                                                        ))}
                                                </div>

                                                {assembly.afterAssemblyHierarchy.length === 0 && (
                                                    <div className="text-center py-12 text-gray-500">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <span className="text-2xl">📭</span>
                                                        </div>
                                                        <p>No items in this assembly</p>
                                                        <p className="text-sm mt-1">Drag items here to get started</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </SortableContext>

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

                <DragOverlay dropAnimation={null}>
                    {activeId && draggedNode ? (
                        <div className="bg-white border-2 border-blue-500 rounded-lg p-2 shadow-xl transform rotate-2 scale-90 max-w-xs"
                            style={{
                                zIndex: 9999,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(59,130,246,0.3)'
                            }}>
                            <div className="flex items-center gap-2">
                                <div className="animate-pulse">
                                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                    {draggedNode.levelName}
                                </span>
                                <span className="font-semibold text-gray-900 text-sm truncate flex-1">
                                    {draggedNode.displayName}
                                </span>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                            </div>
                        </div>
                    ) : activeId ? (
                        <div className="bg-white border-2 border-gray-300 rounded-lg p-2 shadow-lg opacity-75 max-w-xs">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                <span className="font-medium text-gray-600 text-sm">Dragging...</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}