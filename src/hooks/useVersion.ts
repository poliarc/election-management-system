import { useMemo } from 'react';
import packageJson from '../../package.json';
import { version as reactVersion } from 'react';

interface VersionInfo {
    version: string;
    name: string;
    environment: string;
    fullVersionString: string;
    displayVersion: string;
    buildTime?: string;
    buildNumber?: string;
    reactVersion: string;
    useReactVersion?: boolean;
}

export function useVersion(useReactVersion = false): VersionInfo {
    const versionInfo = useMemo(() => {
        // Get version from environment variables or package.json
        const envVersion = import.meta.env.VITE_APP_VERSION;
        const appVersion = envVersion || packageJson.version;
        const version = useReactVersion ? reactVersion : appVersion;

        // Get app name from environment or package.json
        const envName = import.meta.env.VITE_APP_NAME;
        const name = envName || packageJson.name;

        // Determine environment - prefer env variable over Vite mode
        const envEnvironment = import.meta.env.VITE_ENVIRONMENT;
        const environment = envEnvironment || import.meta.env.MODE || 'development';

        // Get build info from environment variables (set during build process)
        const buildTime = import.meta.env.VITE_BUILD_TIME;
        const buildNumber = import.meta.env.VITE_BUILD_NUMBER;

        // Create display strings
        const displayVersion = useReactVersion ? `React v${version}` : `v${version}`;
        const fullVersionString = `${name} ${displayVersion}`;

        return {
            version,
            name,
            environment,
            fullVersionString,
            displayVersion,
            buildTime,
            buildNumber,
            reactVersion,
            useReactVersion
        };
    }, [useReactVersion]);

    return versionInfo;
}