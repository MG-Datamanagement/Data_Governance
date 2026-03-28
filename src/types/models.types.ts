/**
 * models.types.ts
 * Types for the AI Model Registry module.
 * Covers: model metadata, list items, tags, datasets, risk tiers.
 */

export interface ModelTag {
  name: string;
  color: "blue" | "purple" | "orange" | "green" | "red";
}

export interface ModelDataset {
  name: string;
  purpose: "Training" | "Evaluation";
  classification: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  source: string;
  task: string;
  owner: string;
  status: "Approved" | "Pending Review" | "Deprecated";
  lastUpdated: string;
  tags: ModelTag[];
  riskTier: "Low Risk" | "Medium Risk" | "High Risk";
  dataPrivacyReview: {
    status: "Passed" | "Failed" | "Pending";
    lastReviewed: string;
  };
  biasFairnessEval: {
    status: "Passed" | "Failed" | "Pending";
    description: string;
  };
  downstreamAgents: number;
  apiEndpoint: string;
  accessControl: string;
  datasets: ModelDataset[];
}

export interface ModelListItem {
  id: string;
  name: string;
  version: string;
  source: string;
  task: string;
  status: "Approved" | "Pending Review" | "Deprecated";
  owner: string;
  lastUpdated: string;
  tags: ModelTag[];
  description?: string;
}
