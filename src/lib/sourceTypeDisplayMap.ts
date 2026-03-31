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
  postgres:    { icon: Database, iconColor: "text-slate-600" },
  postgresql:  { icon: Database,     iconColor: "text-slate-600" },
  snowflake:   { icon: Database,   iconColor: "text-sky-600" },
  mongodb:     { icon: Database,        iconColor: "text-green-600" },
  mongo:       { icon: Database,        iconColor: "text-green-600" },
  redshift:    { icon: Database,         iconColor: "text-red-700" },
  aws_s3:      { icon: Database,         iconColor: "text-red-700" },
  athena:      { icon: Database,         iconColor: "text-red-700" },
  databricks:  { icon: Database,         iconColor: "text-red-700" },
  gcs:         { icon: Database,         iconColor: "text-red-700" },
  gcp:         { icon: Database,         iconColor: "text-red-700" },
  gcp_bigquery: { icon: Database,         iconColor: "text-red-700" },
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
