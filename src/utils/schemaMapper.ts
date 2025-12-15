import { TableData } from "./exportUitls";

export interface ExportableSchemaRow {
  Column: string;
  Type: string;
  Nullable: 'YES' | 'NO';
  Keys: 'PRIMARY' | 'FOREIGN' | '';
  Sensitivity: string;
  Description: string;
}

/**
 * Extracts exportable schema data from a TableData object
 */
export const extractSchemaData = (table: TableData): ExportableSchemaRow[] => {
  if (!table?.columns) return [];

  return table.columns.map(col => ({
    Column: col.name,
    Type: col.data_type,
    Nullable: col.is_nullable ? 'YES' : 'NO',
    Keys: col.is_primary_key ? 'PRIMARY' : col.is_foreign_key ? 'FOREIGN' : '',
    Sensitivity: col.sensitivity_level,
    Description: col.description,
  }));
};
