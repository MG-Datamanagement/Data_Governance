"use client";

import React from "react";
import { PanelRightOpen, PanelRightClose, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  /** Current collapsed state */
  collapsed: boolean;
  /** Callback to toggle the state */
  onToggle: () => void;
  /** Side where the sidebar is located ('left' for nav, 'right' for details) */
  side?: "left" | "right";
  /** Optional title for accessibility */
  title?: string;
  /** Additional CSS classes for positioning */
  className?: string;
  /** Size of the Lucide icons (default: 22) */
  iconSize?: number;
  /** Optional custom icons to overrides defaults */
  ExpandIcon?: LucideIcon;
  CollapseIcon?: LucideIcon;
}

/**
 * SidebarToggle
 * 
 * A standardized button for expanding/collapsing sidebars.
 * Automatically chooses the correct "arrow" icons based on the `side` prop.
 */
export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  collapsed,
  onToggle,
  side = "right",
  title,
  className,
  iconSize = 22,
  ExpandIcon,
  CollapseIcon,
}) => {
  // Determine default icons based on the side and collapsed state.
  // PanelRightOpen/Close names in Lucide describe the visual action of the chevron.
  const getDefaultIcons = () => {
    if (side === "right") {
      return {
        exp: ExpandIcon || PanelRightOpen,
        col: CollapseIcon || PanelRightClose,
      };
    }
    // For left sidebars, the icons are typically flipped in meaning.
    return {
      exp: ExpandIcon || PanelRightClose,
      col: CollapseIcon || PanelRightOpen,
    };
  };

  const { exp: ActiveExpandIcon, col: ActiveCollapseIcon } = getDefaultIcons();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      type="button"
      title={title || (collapsed ? "Expand sidebar" : "Collapse sidebar")}
      className={cn(
        "flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-indigo-600 active:scale-95 outline-none focus:ring-0",
        className
      )}
    >
      {collapsed ? (
        <ActiveExpandIcon size={iconSize} />
      ) : (
        <ActiveCollapseIcon size={iconSize} />
      )}
    </button>
  );
};
