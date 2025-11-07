export interface TableTag {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface TableColumn {
  id: number;
  urn: string;
  table_id: number;
  name: string;
  description: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  sensitivity_level: string;
  // optional fields
  max_length?: number | null;
  precision?: number | null;
  scale?: number | null;
  default_value?: string | null;
  is_pii?: boolean;
  ordinal_position?: number;
  tags?: TableTag[];
}

export interface TableData {
  id: number;
  urn: string;
  name: string;
  schema_name: string;
  description: string;
  columns: TableColumn[];
}


/**
 * Converts array of objects to a CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(data: T[]): string => {
  if (!data?.length) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
    ),
  ];

  return csvRows.join('\n');
};

/**
 * Triggers a browser file download
 */
export const downloadFile = (content: string, filename: string, type = 'text/csv'): void => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
