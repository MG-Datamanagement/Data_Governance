import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";

  const pad = (n: number) => n.toString().padStart(2, "0");

  const day = pad(d.getUTCDate());
  const month = pad(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "excellent":
      return "text-success";
    case "warning":
      return "text-warning";
    case "critical":
      return "text-danger";
    default:
      return "text-gray-600";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-200 text-red-900 border border-red-300 font-bold";
    case "HIGH":
      return "bg-red-100 text-red-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "LOW":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Converts ISO time string into:
 *  - "Just now"
 *  - "5 mins ago"
 *  - "1 hr ago"
 *  - "2 hrs ago"
 *  - "3 days ago"
 */
export function formatTimeAgo(timeString: string): string {
  const past = new Date(timeString);

  if (isNaN(past.getTime())) {
    return timeString;
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

const platformColors = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#A855F7", // purple
  "#EC4899", // pink
  "#6366F1", // indigo
  "#F97316", // orange
  "#14B8A6", // teal
];

export function getPlatformColor(name: string) {
  let hash = 5381;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }

  const index = Math.abs(hash) % platformColors.length;
  return platformColors[index];
}

export function getTagColor(name: string): string {
  if (!name) return "#E5E7EB"; // Gray-200 fallback

  const normalizedName = name.trim().toUpperCase();

  const colorMap: Record<string, string> = {
    'PII': '#FECACA',          // Red-200
    'SENSITIVE': '#FED7AA',    // Orange-200
    'CONFIDENTIAL': '#E9D5FF', // Purple-200
    'PRIVATE': '#FBCFE8',      // Pink-200
    'PUBLIC': '#BBF7D0',       // Green-200
    'INTERNAL': '#BFDBFE',      // Blue-200
    'RESTRICTED': '#FECDD3',    // Rose-200
    'GDPR': '#A5F3FC',         // Cyan-200
    'HIPAA': '#99F6E4',        // Teal-200
    'PCI': '#C7D2FE',          // Indigo-200
  };

  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }

  // Fallback to deterministic hash for other tags
  const tagColors = [
    "#BFDBFE", // Blue-200
    "#BBF7D0", // Green-200
    "#E9D5FF", // Purple-200
    "#FBCFE8", // Pink-200
    "#C7D2FE", // Indigo-200
    "#FED7AA", // Orange-200
    "#99F6E4", // Teal-200
    "#FECDD3", // Rose-200
    "#A5F3FC", // Cyan-200
    "#DDD6FE", // Violet-200
  ];

  let hash = 5381;
  for (let i = 0; i < normalizedName.length; i++) {
    hash = (hash * 33) ^ normalizedName.charCodeAt(i);
  }

  const index = Math.abs(hash) % tagColors.length;
  return tagColors[index];
}

export function getTagTextColor(name: string): string {
  if (!name) return "#374151"; // Gray-700

  const normalizedName = name.trim().toUpperCase();

  const colorMap: Record<string, string> = {
    'PII': '#B91C1C',          // Red-700
    'SENSITIVE': '#C2410C',    // Orange-700
    'CONFIDENTIAL': '#7E22CE', // Purple-700
    'PRIVATE': '#BE185D',      // Pink-700
    'PUBLIC': '#15803D',       // Green-700
    'INTERNAL': '#1D4ED8',      // Blue-700
    'RESTRICTED': '#BE123C',    // Rose-700
    'GDPR': '#0E7490',         // Cyan-700
    'HIPAA': '#0F766E',        // Teal-700
    'PCI': '#4338CA',          // Indigo-700
  };

  return colorMap[normalizedName] || "#374151";
}

export function getTagDotColor(name: string): string {
  if (!name) return "#9CA3AF"; // Gray-400 fallback

  const normalizedName = name.trim().toUpperCase();

  const colorMap: Record<string, string> = {
    'PII': '#F87171',          // Red-400
    'SENSITIVE': '#FB923C',    // Orange-400
    'CONFIDENTIAL': '#C084FC', // Purple-400
    'PRIVATE': '#F472B6',      // Pink-400
    'PUBLIC': '#4ADE80',       // Green-400
    'INTERNAL': '#60A5FA',      // Blue-400
    'RESTRICTED': '#FB7185',    // Rose-400
    'GDPR': '#22D3EE',         // Cyan-400
    'HIPAA': '#2DD4BF',        // Teal-400
    'PCI': '#818CF8',          // Indigo-400
  };

  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }

  const dotColors = [
    "#60A5FA", "#4ADE80", "#C084FC", "#F472B6", "#818CF8", 
    "#FB923C", "#2DD4BF", "#FB7185", "#22D3EE", "#A78BFA",
  ];

  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    hash = normalizedName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % dotColors.length;
  return dotColors[index];
}

export function getSourceColor(platform: string): string {
  if (!platform) return "#F3F4F6"; // Gray-100 fallback

  const normalized = platform.trim().toLowerCase();

  const colorMap: Record<string, string> = {
    // Blue-100: Postgres, Azure, BigQuery, Airflow, Cassandra, DynamoDB
    postgresql: "#DBEAFE",
    postgres: "#DBEAFE",
    bigquery: "#DBEAFE",
    azure: "#DBEAFE",
    airflow: "#DBEAFE",
    cassandra: "#DBEAFE",
    google: "#DBEAFE",
    dynamodb: "#DBEAFE",
    powerbi: "#DBEAFE",
    looker: "#DBEAFE",

    // Green-100: MongoDB, CSV, Excel, Athena
    mongodb: "#DCFCE7",
    mongo: "#DCFCE7",
    csv: "#DCFCE7",
    excel: "#DCFCE7",
    sheets: "#DCFCE7",

    // Red-100: Redshift, Databricks, MSSQL, SQL Server, Oracle
    redshift: "#FEE2E2",
    databricks: "#FEE2E2",
    mssql: "#FEE2E2",
    sqlserver: "#FEE2E2",
    oracle: "#FEE2E2",

    // Purple-100: Athena, Cockroach, Dagster, Druid, DWH, Snowflake
    athena: "#F3E8FF",
    cockroach: "#F3E8FF",
    dagster: "#F3E8FF",
    druid: "#F3E8FF",
    presto: "#F3E8FF",
    trino: "#F3E8FF",
    snow: "#F3E8FF",
    dwh: "#F3E8FF",
    banking: "#F3E8FF",

    // Cyan-100: Snowflake, Superset
    snowflake: "#CFFAFE",
    superset: "#CFFAFE",

    // Orange-100: S3, AWS, Glue, DBT, Clickhouse, Fivetran
    s3: "#FFEDD5",
    aws: "#FFEDD5",
    glue: "#FFEDD5",
    dbt: "#FFEDD5",
    clickhouse: "#FFEDD5",
    fivetran: "#FFEDD5",
    airbyte: "#FFEDD5",

    // Teal-100: MySQL, MariaDB
    mysql: "#CCFBF1",
    mariadb: "#CCFBF1",

    // Indigo-100: Kafka, Elasticsearch, Pulsar
    kafka: "#E0E7FF",
    elasticsearch: "#E0E7FF",
    pulsar: "#E0E7FF",
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (normalized.includes(key)) return color;
  }

  // Fallback to deterministic hash (100 variants)
  const sourceColors = [
    "#DBEAFE", // Blue-100
    "#DCFCE7", // Green-100
    "#FEE2E2", // Red-100
    "#F3E8FF", // Purple-100
    "#FFEDD5", // Orange-100
    "#CFFAFE", // Cyan-100
    "#CCFBF1", // Teal-100
    "#E0E7FF", // Indigo-100
    "#EDE9FE", // Violet-100
    "#FFE4E6", // Rose-100
  ];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % sourceColors.length;
  return sourceColors[index];
}

export function getSourceIconColor(platform: string): string {
  if (!platform) return "#4B5563"; // Gray-600 fallback

  const normalized = platform.trim().toLowerCase();

  const colorMap: Record<string, string> = {
    postgresql: "#1D4ED8", // Blue-700
    postgres: "#1D4ED8",
    bigquery: "#1D4ED8",
    azure: "#1D4ED8",
    airflow: "#1D4ED8",
    cassandra: "#1D4ED8",
    google: "#1D4ED8",
    dynamodb: "#1D4ED8",
    powerbi: "#1D4ED8",
    looker: "#1D4ED8",

    mongodb: "#15803D", // Green-700
    mongo: "#15803D",
    csv: "#15803D",
    excel: "#15803D",
    sheets: "#15803D",

    redshift: "#B91C1C", // Red-700
    databricks: "#B91C1C",
    mssql: "#B91C1C",
    sqlserver: "#B91C1C",
    oracle: "#B91C1C",

    athena: "#7E22CE", // Purple-700
    cockroach: "#7E22CE",
    dagster: "#7E22CE",
    druid: "#7E22CE",
    presto: "#7E22CE",
    trino: "#7E22CE",
    snow: "#7E22CE",
    dwh: "#7E22CE",
    banking: "#7E22CE",

    snowflake: "#0E7490", // Cyan-700
    superset: "#0E7490",

    s3: "#C2410C", // Orange-700
    aws: "#C2410C",
    glue: "#C2410C",
    dbt: "#C2410C",
    clickhouse: "#C2410C",
    fivetran: "#C2410C",
    airbyte: "#C2410C",

    mysql: "#0F766E", // Teal-700
    mariadb: "#0F766E",

    kafka: "#4338CA", // Indigo-700
    elasticsearch: "#4338CA",
    pulsar: "#4338CA",
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (normalized.includes(key)) return color;
  }

  // Fallback to deterministic hash (700 variants)
  const iconColors = [
    "#1D4ED8", // Blue-700
    "#15803D", // Green-700
    "#B91C1C", // Red-700
    "#7E22CE", // Purple-700
    "#C2410C", // Orange-700
    "#0E7490", // Cyan-700
    "#0F766E", // Teal-700
    "#4338CA", // Indigo-700
    "#7C3AED", // Violet-700
    "#BE123C", // Rose-700
  ];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % iconColors.length;
  return iconColors[index];
}


export const downloadCSV = (csv: string, filename: string): void => {
  if (!csv) {
    console.error("CSV is empty");
    return;
  }

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const downloadFileFromResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();

  // extract filename from header
  const disposition = response.headers.get("content-disposition");
  let fileName = "my_db_datasets";

  if (disposition && disposition.includes("filename=")) {
    fileName = disposition.split("filename=")[1].replace(/"/g, "");
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

export const formatIST = (isoString: string): string => {
  const date = new Date(isoString);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find(p => p.type === type)?.value ?? '';

  const month = get('month').toUpperCase(); // MAR
  const day = get('day');                   // 18
  const year = get('year');                 // 2026
  const hour = get('hour');                 // 08
  const minute = get('minute');             // 30

  return `${month}/${day}/${year}    ${hour}:${minute} IST`;
};

export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getInitials = (nameStr: string) => {
  if (!nameStr) return "U";
  const name = nameStr.split(" ")[0];
  if (name.length >= 2) return name.slice(0, 2).toUpperCase();
  return name.charAt(0).toUpperCase();
};

export const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts or older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};