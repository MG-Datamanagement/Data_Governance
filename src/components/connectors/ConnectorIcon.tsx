"use client";

import React from "react";
import { SourceIcons, SourceIconKey } from "@/assets/source-icons";

interface ConnectorIconProps extends React.SVGProps<SVGSVGElement> {
    icon: string;
    className?: string; // Explicitly included for convenience, though part of SVGProps
}

/**
 * ConnectorIcon component for rendering data source and connector icons.
 * Uses a static registry (SourceIcons) for better performance and type safety.
 */
const ConnectorIcon: React.FC<ConnectorIconProps> = ({
    icon,
    className = "w-10 h-10",
    ...props
}) => {
    // Normalize the icon key
    const iconKey = icon.toLowerCase() as SourceIconKey;
    
    // Lookup the component in our registry, fallback to CSV if missing
    const IconComponent = SourceIcons[iconKey] || SourceIcons["csv"];

    if (!IconComponent) return null;

    return <IconComponent className={className} {...props} />;
};

// Use React.memo for optimized performance across parent re-renders
export default React.memo(ConnectorIcon);