import { useVersion } from "../hooks/useVersion";

interface VersionDisplayProps {
    variant?: "full" | "short" | "badge";
    className?: string;
    showEnvironment?: boolean;
    showBuildTime?: boolean;
    useReactVersion?: boolean;
    showBothVersions?: boolean;
}

export default function VersionDisplay({
    variant = "short",
    className = "",
    showEnvironment = false,
    showBuildTime = false,
    useReactVersion = false,
    showBothVersions = false
}: VersionDisplayProps) {
    const { environment, fullVersionString, displayVersion, buildTime, buildNumber, reactVersion } = useVersion(useReactVersion);

    const getVersionText = () => {
        let text = "";

        if (showBothVersions) {
            // Show both app version and React version
            const appInfo = useVersion(false);
            text = `${appInfo.displayVersion} • React v${reactVersion}`;
            if (showEnvironment) {
                text += ` (${environment})`;
            }
        } else {
            // Show either app version or React version
            switch (variant) {
                case "full":
                    text = showEnvironment ? `${fullVersionString} (${environment})` : fullVersionString;
                    break;
                case "badge":
                    text = displayVersion;
                    break;
                case "short":
                default:
                    text = showEnvironment ? `${displayVersion} (${environment})` : displayVersion;
                    break;
            }
        }

        // Add build info if requested and available (typically in production)
        if (showBuildTime && environment === 'production') {
            if (buildTime && buildNumber) {
                text += ` • Build #${buildNumber} (${new Date(buildTime).toLocaleDateString()})`;
            } else if (buildTime) {
                text += ` • Built: ${new Date(buildTime).toLocaleDateString()}`;
            }
        }

        return text;
    };

    const getVariantClasses = () => {
        switch (variant) {
            case "badge":
                return "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800";
            case "full":
                return "text-sm text-gray-600";
            case "short":
            default:
                return "text-xs text-gray-500";
        }
    };

    return (
        <span className={`${getVariantClasses()} ${className}`}>
            {getVersionText()}
        </span>
    );
}