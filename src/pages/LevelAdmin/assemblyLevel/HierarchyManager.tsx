import { useState, useEffect } from 'react';
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

import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Settings, RefreshCw, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../../store/hooks';
import {
    fetchAfterAssemblyHierarchy,
    updateAfterAssemblyData,
} from '../../../services/afterAssemblyApi';
import type { HierarchyNode, AssemblyHierarchy } from '../../../services/afterAssemblyApi';

interface DraggableNodeProps {
    node: HierarchyNode;
    level: number;
    onToggle: (nodeId: number) => void;
    expandedNodes: Set<number>;
}

interface AssemblyDropZoneProps {
    assembly: any;
    children: React.ReactNode;
}

interface AssemblyBottomDropZoneProps {
    assembly: any;
}

function AssemblyDropZone({ assembly, children }: AssemblyDropZoneProps) {
    const {
        setNodeRef,
        isOver,
    } = useSortable({
        id: assembly.id,
        data: { type: 'assembly', assembly },
    });

    return (
        <div
            ref={setNodeRef}
            className={`assembly-container ${isOver ? 'assembly-drop-target' : ''}`}
        >
            {children}
        </div>
    );
}

function AssemblyBottomDropZone({ assembly }: AssemblyBottomDropZoneProps) {
    const {
        setNodeRef,
        isOver,
    } = useSortable({
        id: `assembly-bottom-${assembly.id}`,
        data: { type: 'assembly', assembly },
    });

    return (
        <div
            ref={setNodeRef}
            className={`assembly-drop-zone-bottom mt-4 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all min-h-[50px] flex items-center justify-center ${isOver
                ? 'border-green-400 bg-green-100 text-green-700'
                : 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-400 hover:bg-blue-100'
                }`}
            title={`Drop items here to make them direct children of ${assembly.levelName} assembly`}
            data-assembly-id={assembly.id}
            data-drop-type="assembly"
        >
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                    {isOver ? '🎯 Drop here for Assembly!' : '🏛️ Drop here for Assembly'}
                </span>
            </div>
        </div>
    );
}

function DraggableNode({ node, level, onToggle, expandedNodes }: DraggableNodeProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
        isOver,
    } = useSortable({
        id: node.id,
        data: { type: 'node', node },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : 'transform 200ms ease',
        opacity: isDragging ? 0.5 : 1,
        marginLeft: `${level * 24}px`,
        position: 'relative',
        zIndex: isDragging ? 1000 : level === 0 ? 10 : 5,
    };

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const getLevelColor = (levelName: string) => {
        const colors = {
            Block: 'bg-blue-100 text-blue-800 border-blue-200',
            Mandal: 'bg-green-100 text-green-800 border-green-200',
            Sector: 'bg-purple-100 text-purple-800 border-purple-200',
            Zone: 'bg-orange-100 text-orange-800 border-orange-200',
            Ward: 'bg-pink-100 text-pink-800 border-pink-200',
            PollingCenter: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            Booth: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[levelName as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="drag-container" style={{ position: 'relative' }}>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={`draggable-node hierarchy-item flex items-center gap-2 p-3 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing ${isDragging
                    ? 'opacity-50'
                    : isOver
                        ? 'drop-target ring-2 ring-green-400 bg-green-50 border-green-300'
                        : 'hover:bg-gray-50 hover:shadow-md'
                    }`}
                data-node-id={node.id}
                data-level={level}
                data-level-name={node.levelName}
            >
                {hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded z-10 relative"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                    </button>
                )}

                {!hasChildren && <div className="w-6" />}

                <div className="flex items-center gap-3 flex-1">
                    <span className={`level-badge px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(node.levelName)}`}>
                        {node.levelName}
                    </span>

                    <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{node.displayName}</h3>
                        <p className="text-sm text-gray-500">{node.partyLevelName}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>ID: {node.id}</span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            Level {level}
                        </span>
                        {hasChildren && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="mt-2 space-y-2 relative">
                    <div
                        className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent opacity-50"
                        style={{ marginLeft: `${level * 24}px` }}
                    ></div>
                    {node.children.map((child) => (
                        <div key={child.id} className="relative">
                            <div
                                className="absolute w-6 h-0.5 bg-blue-300 opacity-50 top-1/2 transform -translate-y-1/2"
                                style={{ left: `${(level + 1) * 24 - 18}px` }}
                            ></div>
                            <DraggableNode
                                node={child}
                                level={level + 1}
                                onToggle={onToggle}
                                expandedNodes={expandedNodes}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function HierarchyManager() {
    const { user } = useAppSelector((state) => state.auth);
    const [hierarchyData, setHierarchyData] = useState<AssemblyHierarchy[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [selectedState, setSelectedState] = useState<number>(1);
    const [selectedParty, setSelectedParty] = useState<number>(1);
    const [showFilters, setShowFilters] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [draggedNode, setDraggedNode] = useState<HierarchyNode | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );

    // Advanced collision detection that properly handles nested elements
    const customCollisionDetection = (args: any) => {
        const { pointerCoordinates } = args;

        if (!pointerCoordinates) {
            return rectIntersection(args);
        }

        // Get all potential collisions
        const pointerCollisions = pointerWithin(args);

        if (pointerCollisions.length === 0) {
            return rectIntersection(args);
        }

        console.log('🎯 All collisions:', pointerCollisions.map(c => c.id));

        // Separate assembly collisions from node collisions
        const assemblyCollisions = pointerCollisions.filter(collision => {
            // Check if it's an assembly ID
            const isAssembly = hierarchyData.some(assembly => assembly.assembly.id === collision.id);

            // Also check if it's an assembly drop zone element
            const element = document.querySelector(`[data-assembly-id="${collision.id}"]`);
            const isAssemblyDropZone = element && element.getAttribute('data-drop-type') === 'assembly';

            return isAssembly || isAssemblyDropZone;
        });

        const nodeCollisions = pointerCollisions.filter(collision => {
            return !hierarchyData.some(assembly => assembly.assembly.id === collision.id);
        });

        // Always prioritize assembly collisions
        if (assemblyCollisions.length > 0) {
            console.log('🏛️ Assembly collision detected:', assemblyCollisions[0].id);
            return assemblyCollisions;
        }

        // For node collisions, use a more sophisticated approach
        if (nodeCollisions.length > 0) {
            // Get the actual DOM elements and their positions
            const collisionDetails = nodeCollisions.map(collision => {
                const element = document.querySelector(`[data-node-id="${collision.id}"]`);
                const level = element?.getAttribute('data-level') || '999';
                const levelName = element?.getAttribute('data-level-name') || '';

                // Get element bounds
                const rect = element?.getBoundingClientRect();

                return {
                    id: collision.id,
                    level: parseInt(level),
                    levelName,
                    element,
                    rect,
                    // Calculate distance from pointer to element center
                    distanceFromCenter: rect ? Math.sqrt(
                        Math.pow(pointerCoordinates.x - (rect.left + rect.width / 2), 2) +
                        Math.pow(pointerCoordinates.y - (rect.top + rect.height / 2), 2)
                    ) : Infinity
                };
            });

            // Sort by level first (higher level = lower number = higher priority)
            // Then by distance from center (closer = higher priority)
            const sortedCollisions = collisionDetails.sort((a, b) => {
                // First priority: level (Block = 0, Mandal = 1, etc.)
                if (a.level !== b.level) {
                    return a.level - b.level;
                }
                // Second priority: distance from pointer (closer wins)
                return a.distanceFromCenter - b.distanceFromCenter;
            });

            console.log('📦 Sorted collisions:', sortedCollisions.map(c => ({
                id: c.id,
                level: c.level,
                levelName: c.levelName,
                distance: Math.round(c.distanceFromCenter)
            })));

            // Return the best match
            const bestMatch = sortedCollisions[0];
            console.log('🎯 Selected target:', bestMatch.id, bestMatch.levelName);

            return [{ id: bestMatch.id }];
        }

        return rectIntersection(args);
    };

    useEffect(() => {
        if (user?.state_id) setSelectedState(user.state_id);
        if (user?.partyId) setSelectedParty(user.partyId);
    }, [user]);

    useEffect(() => {
        loadHierarchyData();
    }, [selectedState, selectedParty]);

    const loadHierarchyData = async () => {
        try {
            setLoading(true);
            const response = await fetchAfterAssemblyHierarchy(selectedState, selectedParty);
            if (response.success) {
                setHierarchyData(response.data);
                const firstLevelIds = response.data.flatMap(assembly =>
                    assembly.afterAssemblyHierarchy.map(node => node.id)
                );
                setExpandedNodes(new Set(firstLevelIds));
            }
        } catch (error) {
            console.error('Failed to load hierarchy data:', error);
            toast.error('Failed to load hierarchy data');
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (nodeId: number) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

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

        // Add body class for drag state
        document.body.classList.add('dragging');

        // Optimize scroll performance
        document.documentElement.style.scrollBehavior = 'auto';

        console.log('🚀 Drag started:', { id, node: node?.displayName });
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (over) {
            // Clear previous highlights
            document.querySelectorAll('.drag-target-highlight').forEach(el => {
                el.classList.remove('drag-target-highlight');
            });

            // Highlight current target
            const targetElement = document.querySelector(`[data-node-id="${over.id}"]`);
            if (targetElement) {
                targetElement.classList.add('drag-target-highlight');

                const levelName = targetElement.getAttribute('data-level-name');
                const level = targetElement.getAttribute('data-level');
                console.log('📍 Dragging over:', {
                    id: over.id,
                    levelName,
                    level
                });
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setDraggedNode(null);

        // Remove body class for drag state
        document.body.classList.remove('dragging');

        // Restore scroll behavior
        document.documentElement.style.scrollBehavior = '';

        // Clear any remaining highlights
        document.querySelectorAll('.drag-target-highlight').forEach(el => {
            el.classList.remove('drag-target-highlight');
        });

        if (!over || active.id === over.id) {
            return;
        }

        const draggedNodeFromHierarchy = findNodeInHierarchy(active.id as number);
        if (!draggedNodeFromHierarchy) {
            return;
        }

        const targetId = over.id; // Keep as UniqueIdentifier (string | number)

        console.log('🎯 Drop detected:', {
            draggedNode: draggedNodeFromHierarchy.displayName,
            targetId: targetId,
            draggedLevel: draggedNodeFromHierarchy.levelName
        });

        // Check if we're dropping on an assembly first (highest priority)
        let targetAssembly = hierarchyData.find(assembly => assembly.assembly.id === targetId);

        // Also check for bottom drop zone format: "assembly-bottom-{id}"
        if (!targetAssembly && typeof targetId === 'string' && targetId.startsWith('assembly-bottom-')) {
            const assemblyId = parseInt(targetId.replace('assembly-bottom-', ''));
            targetAssembly = hierarchyData.find(assembly => assembly.assembly.id === assemblyId);
            if (targetAssembly) {
                console.log('🏛️ Dropping on assembly bottom zone:', targetAssembly.assembly.levelName);
                await performMove(draggedNodeFromHierarchy, { type: 'assembly', id: assemblyId, assembly: targetAssembly });
                return;
            }
        }

        if (targetAssembly) {
            console.log('🏛️ Dropping on assembly:', targetAssembly.assembly.levelName);
            await performMove(draggedNodeFromHierarchy, { type: 'assembly', id: targetAssembly.assembly.id, assembly: targetAssembly });
            return;
        }

        // Check if we're dropping on a node (only for numeric IDs)
        const targetNode = typeof targetId === 'number' ? findNodeInHierarchy(targetId) : null;
        if (targetNode) {
            console.log('📦 Dropping on node:', {
                targetName: targetNode.displayName,
                targetLevel: targetNode.levelName,
                targetParentId: targetNode.parentId,
                targetParentAssemblyId: targetNode.parentAssemblyId
            });

            // Prevent dropping a parent onto its own child
            if (isParentOfTarget(draggedNodeFromHierarchy, targetNode.id)) {
                toast.error('Cannot move parent into its own child');
                return;
            }

            // Special handling: If dragging to a higher level node (like Block when current is in Mandal)
            // Make sure we're actually targeting the intended node
            const draggedLevel = getLevelHierarchy(draggedNodeFromHierarchy.levelName);
            const targetLevel = getLevelHierarchy(targetNode.levelName);

            console.log('📊 Level comparison:', {
                draggedLevel,
                targetLevel,
                isMovingToHigherLevel: targetLevel < draggedLevel
            });

            await performMove(draggedNodeFromHierarchy, { type: 'node', id: targetNode.id, node: targetNode });
            return;
        }

        console.log('❌ No valid drop target found for ID:', targetId);
    };

    // Helper function to get level hierarchy order (lower number = higher in hierarchy)
    const getLevelHierarchy = (levelName: string): number => {
        const hierarchy = {
            'Block': 1,
            'Mandal': 2,
            'Sector': 3,
            'Zone': 4,
            'Ward': 5,
            'PollingCenter': 6,
            'Booth': 7
        };
        return hierarchy[levelName as keyof typeof hierarchy] || 999;
    };

    const isParentOfTarget = (node: HierarchyNode, targetId: number): boolean => {
        if (node.id === targetId) return true;
        return node.children?.some(child => isParentOfTarget(child, targetId)) || false;
    };

    const performMove = async (draggedNode: HierarchyNode, target: { type: 'assembly' | 'node', id: number, assembly?: any, node?: HierarchyNode }) => {
        try {
            let updatePayload: any = {};

            if (target.type === 'assembly') {
                // Moving to assembly - make it a direct assembly child
                // parentId = null (no parent node), parentAssemblyId = assembly.id
                updatePayload = {
                    parentId: null,
                    parentAssemblyId: target.id
                };
            } else {
                // Moving to node - make it a child of that node  
                // Only send parentId, don't send parentAssemblyId to avoid validation error
                updatePayload = {
                    parentId: target.id
                };

                // Only include parentAssemblyId if the dragged node currently has one
                // (to clear it when moving from assembly child to node child)
                if (draggedNode.parentAssemblyId !== null) {
                    updatePayload.parentAssemblyId = null;
                }
            }

            console.log('Update payload:', updatePayload);
            console.log('Current node state:', {
                id: draggedNode.id,
                displayName: draggedNode.displayName,
                parentId: draggedNode.parentId,
                parentAssemblyId: draggedNode.parentAssemblyId
            });

            const response = await updateAfterAssemblyData(draggedNode.id, updatePayload);

            if (response.success) {
                const targetName = target.type === 'assembly'
                    ? target.assembly?.assembly.levelName
                    : target.node?.displayName;

                toast.success(`✅ Moved ${draggedNode.displayName} to ${targetName}`);
                await loadHierarchyData();
            } else {
                console.error('API Error Response:', response);
                toast.error('❌ Failed to update: ' + (response.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Move failed:', error);

            // Try to parse the error message for better user feedback
            let errorMessage = 'Failed to update hierarchy';
            if (error.message) {
                try {
                    const errorData = JSON.parse(error.message);
                    if (errorData.error && errorData.error.details) {
                        const validationErrors = errorData.error.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
                        errorMessage = `Validation Error: ${validationErrors}`;
                    } else if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch {
                    errorMessage = error.message;
                }
            }

            toast.error(`❌ ${errorMessage}`);
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

    const allNodeIds = [
        ...hierarchyData.flatMap(assembly => getAllNodeIds(assembly.afterAssemblyHierarchy)),
        ...hierarchyData.map(assembly => assembly.assembly.id),
        // Add assembly drop zone IDs with a prefix to avoid conflicts
        ...hierarchyData.map(assembly => `assembly-bottom-${assembly.assembly.id}`)
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Settings className="w-6 h-6 text-blue-600" />
                            <h1 className="text-xl font-semibold text-gray-900">
                                Assembly Hierarchy Management
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <Settings className="w-4 h-4" />
                                Filters
                                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>

                            <button
                                onClick={loadHierarchyData}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                                    State
                                </label>
                                <select
                                    id="state"
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value={1}>State 1</option>
                                    <option value={2}>State 2</option>
                                    <option value={3}>State 3</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="party" className="block text-sm font-medium text-gray-700 mb-2">
                                    Party
                                </label>
                                <select
                                    id="party"
                                    value={selectedParty}
                                    onChange={(e) => setSelectedParty(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value={1}>Party 1</option>
                                    <option value={2}>Party 2</option>
                                    <option value={3}>Party 3</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Assembly Hierarchy Manager</h2>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                                <span>Drag cards to reorganize hierarchy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4" />
                                <span>Click to expand/collapse</span>
                            </div>
                        </div>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={customCollisionDetection}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        autoScroll={{
                            enabled: true,
                            threshold: {
                                x: 0.2,
                                y: 0.2,
                            },
                            acceleration: 10,
                            interval: 5,
                        }}
                    >
                        <SortableContext items={allNodeIds} strategy={verticalListSortingStrategy}>
                            <div className="space-y-6">
                                {hierarchyData.map((assembly) => (
                                    <AssemblyDropZone key={assembly.assembly.id} assembly={assembly.assembly}>
                                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border relative">
                                            {/* Top Assembly Drop Zone */}
                                            <div
                                                className="flex items-center gap-3 mb-4 pb-4 border-b assembly-drop-zone bg-blue-50 rounded-lg p-4 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-100 transition-all cursor-pointer min-h-[60px]"
                                                title={`Drop items here to make them direct children of ${assembly.assembly.levelName} assembly`}
                                                data-assembly-id={assembly.assembly.id}
                                                data-drop-type="assembly"
                                            >
                                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs">🏛️</span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {assembly.assembly.levelName}
                                                </h3>
                                                <span className="px-3 py-1 text-xs font-medium bg-blue-200 text-blue-900 rounded-full">
                                                    Assembly (ID: {assembly.assembly.id})
                                                </span>
                                                <div className="ml-auto flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-800 text-xs">⬇️</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 relative">
                                                {assembly.afterAssemblyHierarchy.map((node) => (
                                                    <DraggableNode
                                                        key={node.id}
                                                        node={node}
                                                        level={0}
                                                        onToggle={toggleNode}
                                                        expandedNodes={expandedNodes}
                                                    />
                                                ))}
                                            </div>

                                            {/* Bottom Assembly Drop Zone - More prominent when dragging */}
                                            <AssemblyBottomDropZone assembly={assembly.assembly} />

                                            {assembly.afterAssemblyHierarchy.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    No hierarchy data available for this assembly
                                                </div>
                                            )}
                                        </div>
                                    </AssemblyDropZone>
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay dropAnimation={null}>
                            {activeId && draggedNode ? (
                                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-2xl transform rotate-3 scale-105"
                                    style={{
                                        zIndex: 9999,
                                        boxShadow: '0 25px 50px rgba(0,0,0,0.25), 0 10px 20px rgba(59,130,246,0.4)'
                                    }}>
                                    <div className="flex items-center gap-3">
                                        <div className="animate-pulse">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                        </div>
                                        <span className="px-3 py-1 text-xs font-bold rounded-full border bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
                                            {draggedNode.levelName}
                                        </span>
                                        <span className="font-bold text-gray-900">{draggedNode.displayName}</span>
                                        <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        ID: {draggedNode.id} • Parent: {draggedNode.parentId || draggedNode.parentAssemblyId || 'None'}
                                    </div>
                                </div>
                            ) : activeId ? (
                                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-xl opacity-75">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        <span className="font-medium text-gray-600">Dragging item...</span>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    {hierarchyData.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Hierarchy Data</h3>
                            <p className="text-gray-500">No assembly hierarchy data found for the selected state and party.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}