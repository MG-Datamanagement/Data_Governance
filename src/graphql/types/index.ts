export interface Dataset {
  name: string;
  urn: string;
  description?: string | null;
  lastModifiedTime?: number | null;
  created?: number | null;
  createdActor?: string | null;
  platform: string;
  domain?: {
    urn: string;
    name: string;
  } | null;
  tags: Array<{
    name: string;
    colorHex?: string | null;
  }>;
}

export interface SearchResult {
  total: number;
  results: Dataset[];
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
}

export interface User {
  id: string;
  name: string;
}
