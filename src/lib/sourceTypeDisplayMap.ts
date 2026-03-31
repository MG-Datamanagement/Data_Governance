/**
 * sourceTypeDisplayMap.ts
 *
 * UI-ONLY file. Maps source platform strings → display metadata (icon + color).
 * This is the single source of truth for platform icons — import ONLY from
 * UI components, never from service / lib / types files.
 */
import { Database } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformIcon = LucideIcon;

export interface PlatformDisplayConfig {
  icon: PlatformIcon;
  iconColor: string;
}

const PLATFORM_DISPLAY_MAP: Record<string, PlatformDisplayConfig> = {
  postgres:    { icon: Database,     iconColor: "text-[#336791]" },
  postgresql:  { icon: Database,     iconColor: "text-[#336791]" },
  snowflake:   { icon: Database,     iconColor: "text-[#29B5E8]" },
  mongodb:     { icon: Database,     iconColor: "text-[#00ED64]" },
  mongo:       { icon: Database,     iconColor: "text-[#00ED64]" },
  redshift:    { icon: Database,     iconColor: "text-[#DD344C]" },
  aws_s3:      { icon: Database,     iconColor: "text-[#FF9900]" },
  athena:      { icon: Database,     iconColor: "text-[#9434E4]" },
  databricks:  { icon: Database,     iconColor: "text-[#FF3621]" },
  gcs:         { icon: Database,     iconColor: "text-[#4285F4]" },
  gcp:         { icon: Database,     iconColor: "text-[#4285F4]" },
  gcp_bigquery: { icon: Database,     iconColor: "text-[#4285F4]" },
  csv:         { icon: Database,     iconColor: "text-[#10B981]" },
};

const DEFAULT_DISPLAY: PlatformDisplayConfig = {
  icon: Database,
  iconColor: "text-gray-600",
};

/**
 * Looks up the icon and color for a given platform string (case-insensitive).
 * Falls back to a generic Database icon for unknown platforms.
 */
export function getPlatformDisplay(platform: string): PlatformDisplayConfig {
  const key = platform.toLowerCase();
  for (const [prefix, config] of Object.entries(PLATFORM_DISPLAY_MAP)) {
    if (key.includes(prefix)) return config;
  }
  return DEFAULT_DISPLAY;
}
