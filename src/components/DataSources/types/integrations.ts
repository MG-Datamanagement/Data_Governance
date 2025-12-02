export type IntegrationCategory =
  | "database"
  | "cloud"
  | "storage"
  | "streaming"
  | "orchestration"
  | "bi"
  | "governance"
  | "processing"
  | "etl"
  | "quality"
  | "ml"
  | "iam"
  | "search"
  | "metadata"
  | "source";

export interface IntegrationType {
  id: string;
  name: string;
  icon: string;      
  color: string;      
  category: IntegrationCategory;
  description: string;
  defaultPort?: string;
}
