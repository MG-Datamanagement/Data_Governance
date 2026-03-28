/**
 * models.mock.ts
 * Mock data for the AI Model Registry module.
 * Extracted from lib/mockData.ts.
 */

import type { ModelListItem, ModelMetadata } from "@/types/models.types";

export const MOCK_MODEL_LIST: ModelListItem[] = [
  { id: "model-1", name: "Customer Churn Predictor", version: "v2.3", source: "Internal", task: "Classification", status: "Approved", owner: "Data Science Team", lastUpdated: "Mar 5, 2026", description: "Predicts likelihood of retail banking customers churning within 90 days based on transaction history.", tags: [{ name: "Finance", color: "blue" }, { name: "Retail", color: "purple" }] },
  { id: "model-2", name: "Fraud Detection Engine", version: "v4.1", source: "AWS SageMaker", task: "Anomaly Detection", status: "Approved", owner: "Risk Analytics", lastUpdated: "Mar 1, 2026", description: "Real-time transaction scoring for potential fraudulent activity.", tags: [{ name: "Security", color: "red" }, { name: "Real-time", color: "orange" }] },
  { id: "model-3", name: "Llama-3-70b-Instruct", version: "v1.0", source: "Hugging Face", task: "Text Generation", status: "Approved", owner: "Platform Team", lastUpdated: "Feb 28, 2026", description: "Large language model open-sourced by Meta, fine-tuned for instruction following.", tags: [{ name: "LLM", color: "blue" }, { name: "Generative AI", color: "purple" }] },
  { id: "model-4", name: "Revenue Forecaster", version: "v1.2-beta", source: "Internal", task: "Time Series", status: "Pending Review", owner: "Finance Analytics", lastUpdated: "Mar 6, 2026", description: "Time-series forecasting model to predict Q3 and Q4 recurring revenue streams.", tags: [{ name: "Finance", color: "blue" }, { name: "Planning", color: "green" }] },
  { id: "model-5", name: "Support Ticket Classifier", version: "v3.0", source: "OpenAI", task: "Classification", status: "Approved", owner: "CX Team", lastUpdated: "Jan 15, 2026", description: "Automatically routes incoming support tickets to the appropriate engineering or CX team.", tags: [{ name: "Customer Success", color: "green" }, { name: "NLP", color: "blue" }] },
  { id: "model-6", name: "Legacy Sentiment Analyzer", version: "v1.5", source: "Internal", task: "Classification", status: "Deprecated", owner: "CX Team", lastUpdated: "Oct 10, 2025", description: "Older model used to determine basic positive/negative sentiment from customer feedback.", tags: [{ name: "Legacy", color: "orange" }, { name: "NLP", color: "blue" }] },
];

export const MOCK_MODEL_METADATA: ModelMetadata = {
  id: "model-1",
  name: "Customer Churn Predictor",
  description: "Predicts likelihood of retail banking customers churning within 90 days based on transaction history.",
  version: "v2.3",
  source: "Internal",
  task: "Classification",
  owner: "Data Science Team",
  status: "Approved",
  lastUpdated: "Mar 5, 2026",
  tags: [{ name: "Finance", color: "blue" }, { name: "Retail", color: "purple" }, { name: "XGBoost", color: "orange" }],
  riskTier: "Medium Risk",
  dataPrivacyReview: { status: "Passed", lastReviewed: "Feb 20, 2026" },
  biasFairnessEval: { status: "Passed", description: "Demographic parity check" },
  downstreamAgents: 2,
  apiEndpoint: "https://api.internal/v1/models/churn-pred/score",
  accessControl: "Restricted via IAM Role",
  datasets: [
    { name: "retail_transactions_master", purpose: "Training", classification: "Confidential" },
    { name: "customer_profiles_v2", purpose: "Training", classification: "PII" },
    { name: "q4_eval_holdout", purpose: "Evaluation", classification: "Internal" },
  ],
};
