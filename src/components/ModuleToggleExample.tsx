import React from 'react';
import { useModules, useModuleAccess } from '../hooks/useModules';
import type { Module, ModuleAccess } from '../services/moduleApi';

interface ModuleToggleButtonProps {
    module: Module;
    onToggle: () => void;
}

const ModuleToggleButton: React.FC<ModuleToggleButtonProps> = ({ module, onToggle }) => {
    const { toggleModuleStatus } = useModules();
    const [loading, setLoading] = React.useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            await toggleModuleStatus(module.module_id, module.isActive === 1);
            onToggle(); // Refresh the list
        } catch (error) {
            console.error('Failed to toggle module status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-3 py-1 rounded-lg transition-colors ${module.isActive === 1
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? 'Loading...' : module.isActive === 1 ? 'Deactivate' : 'Activate'}
        </button>
    );
};

interface ModuleAccessToggleButtonProps {
    moduleAccess: ModuleAccess;
    onToggle: () => void;
}

const ModuleAccessToggleButton: React.FC<ModuleAccessToggleButtonProps> = ({ moduleAccess, onToggle }) => {
    const { toggleAccessStatus } = useModuleAccess();
    const [loading, setLoading] = React.useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            await toggleAccessStatus(moduleAccess.id, moduleAccess.isActive === 1);
            onToggle(); // Refresh the list
        } catch (error) {
            console.error('Failed to toggle access status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-3 py-1 rounded-lg transition-colors ${moduleAccess.isActive === 1
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? 'Loading...' : moduleAccess.isActive === 1 ? 'Deactivate' : 'Activate'}
        </button>
    );
};

export { ModuleToggleButton, ModuleAccessToggleButton };