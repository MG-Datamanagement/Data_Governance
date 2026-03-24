"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  dashboardApiServices,
  ClassificationResponse,
  ApiCatalogDetail,
  ApiCatalogDatacard,
} from "@/services/dashboardApiServices";
import { Dataset, ApiTag, ApiColumn } from "@/types";
import ComplianceReportModal from "@/app/(data-connectors)/components/ComplianceReportModal";
import { formatDateTime, formatIST } from "@/lib/utils";
import { CONSTANTS } from "@/lib/constants";
import { ClassifyScanPhase } from "@/types/datasourcesTypes";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, SparkleIcon } from "lucide-react";
import DatasetLineage from "@/app/(data-connectors)/components/DatasetLineage";
import DatasetQueriesTab from "./DatasetQueriesTab";
import { DatasetRightSidebar } from "./DatasetRightSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { ApiCatalogPreview } from "@/services/dashboardApiServices";

const TABS = [
  "DataCard",
  "Columns",
  "Lineage",
  "Properties",
  "Queries",
  // "Stats",
  // "Quality",
  // "Governance",
  // "Incidents",
] as const;
type Tab = (typeof TABS)[number];

interface DatasetDetailPageProps {
  sourceId: string;
  datasetId: string;
}

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ReclassificationActionWithAiRequest } from "@/services/mock";
import { ComplianceApiResponse, datasourceApiServices } from "@/services/datasourceApiServices";

const DatasetDetailPage: React.FC<DatasetDetailPageProps> = ({
  sourceId,
  datasetId,
}) => {
  const router = useRouter();
  const [catalogData, setCatalogData] = useState<ApiCatalogDetail | null>(null);
  const [datacardData, setDatacardData] = useState<ApiCatalogDatacard | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("DataCard");
  const [showCompliance, setShowCompliance] = useState(false);
  const [isReclassifyAiLoading, setIsReclassifyAiLoading] = useState(false);
  const [reclassifyAiScanPhase, setReclassifyAiScanPhase] =
    useState<ClassifyScanPhase>("never");
  const [aiResults, setAiResults] = useState<any>({});
  const [complianceData, setComplianceData] = useState<ComplianceApiResponse | null>(null);
  const [isComplianceLoading, setIsComplianceLoading] = useState(false);

  const [previewData, setPreviewData] = useState<ApiCatalogPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const [columnsPage, setColumnsPage] = useState(1);
  const columnsPerPage = 5;
  
  const [previewPage, setPreviewPage] = useState(1);
  const previewPerPage = 5;

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [detailRes, datacardRes] = await Promise.all([
          dashboardApiServices.fetchCatalogDetail(datasetId),
          dashboardApiServices.fetchCatalogDatacard(datasetId).catch((err) => {
            console.error("Failed to fetch datacard", err);
            return null;
          }),
        ]);
        setCatalogData(detailRes);
        setDatacardData(datacardRes);
      } catch (err) {
        console.error("Failed to fetch catalog detail", err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleFetchClassifyApi = async () => {
      await fetchAll();
    }

    handleFetchClassifyApi()
  }, [datasetId]);

  useEffect(() => {
    if (activeTab === "Columns" && datasetId) {
      fetchPreviewData();
    }
  }, [activeTab, datasetId, previewPage]);

  const fetchPreviewData = async () => {
    setIsPreviewLoading(true);
    try {
      const res = await dashboardApiServices.fetchCatalogPreview(datasetId, previewPerPage, (previewPage - 1) * previewPerPage);
      setPreviewData(res);
    } catch (err) {
      console.error("Failed to fetch preview data", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const paginatedColumns = useMemo(() => {
    if (!catalogData?.columns) return [];
    const start = (columnsPage - 1) * columnsPerPage;
    return catalogData.columns.slice(start, start + columnsPerPage);
  }, [catalogData?.columns, columnsPage]);

  const previewHeaders = useMemo(() => {
    if (!previewData?.rows?.length) return [];
    return Object.keys(previewData.rows[0]);
  }, [previewData]);

  const fetchCatalogDetail = async () => {
    try {
      const res = await dashboardApiServices.fetchCatalogDetail(datasetId);
      setCatalogData(res);
    } catch (err) {
      console.error("Failed to fetch catalog detail", err);
    }
  }

  const handleViewCompliance = async () => {
    setShowCompliance(true);
    // if (complianceData) return;
    setIsComplianceLoading(true);
    try {
      const res = await datasourceApiServices.fetchDatasetComplianceReport(datasetId);
      setComplianceData(res);
    } catch (err) {
      console.error("Failed to fetch compliance report", err);
      setIsComplianceLoading(false);
    } finally {
      setIsComplianceLoading(false);
    }
  };

  const detail = useMemo(() => {
    if (!catalogData) return null;
    const ownerName =
      typeof catalogData.owner === "string"
        ? catalogData.owner
        : (catalogData?.owner as any)?.name || "Unknown";
    return {
      id: catalogData.id,
      sourceId: sourceId,
      sourceName: catalogData.source_name,
      name: catalogData.table_name,
      type: catalogData.source_type
        ? catalogData.source_type.charAt(0).toUpperCase() +
        catalogData.source_type.slice(1)
        : "Dataset",
      overview:
        catalogData.description ||
        `The ${catalogData.table_name} dataset contains structured records ingested from ${catalogData.source_name}. It belongs to the ${catalogData.schema_name} schema within the ${catalogData.database_name} database.`,
      keyFields: catalogData.columns?.map((c: any) => ({
        name: c.name,
        description: c.comment || "Column metadata",
      })),
      freshness: formatIST(catalogData.updated_at),
      volume:
        catalogData.row_count !== null
          ? `${catalogData.row_count.toLocaleString()}K`
          : "—",
      qualityScore: "95%",
      columnCount: catalogData.column_count || 0,
      owner: ownerName,
      ownerInitials: ownerName.slice(0, 2).toUpperCase(),
      tags: catalogData.tags || [],
      lineageWarning: undefined,
      dataCardContent: datacardData?.data_card,
    };
  }, [catalogData, datacardData, sourceId]);


  const handleReclassificationActionWithAI = async () => {
    setIsReclassifyAiLoading(true);
    setReclassifyAiScanPhase("scanning");

    try {
      const payload: ReclassificationActionWithAiRequest = {
        catalog_id: datasetId,
        save_to_db: CONSTANTS.saveToDb,
        assigned_by: CONSTANTS.assignedBy,
        min_confidence: 0.7,
      };

      const { dataSourcesService } = await import("@/services/mock");
      const response: any = await dataSourcesService.reclassificationActionWithAi(payload);

      const map: any = {};
      response?.results?.forEach((r: any) => {
        map[r.column_name] = ["pii", "phi"].includes(r)
          ? "pii"
          : r
      });

      setAiResults(map);

      setReclassifyAiScanPhase("complete");
    } catch (err) {
      console.log("Error during PII classification:", "never", "false")
      console.error("Error during PII classification:", err);
      setReclassifyAiScanPhase("never");
      setIsReclassifyAiLoading(false);
    } finally {
      setIsReclassifyAiLoading(false);
      setReclassifyAiScanPhase("re-scan");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Global search bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="relative max-w-lg">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Find tables, dashboards, people, and more"
                className="pl-9 pr-16 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                  ⌘
                </kbd>
                <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                  K
                </kbd>
              </span>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-6 animate-pulse" />
          {/* Dataset card skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 mb-5 flex gap-4">
            {/* Left skeleton */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-gray-100 rounded-xl h-48 animate-pulse" />
              <div className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            </div>
            {/* Right sidebar skeleton */}
            <div className="w-64 flex-shrink-0 bg-gray-100 rounded-xl h-96 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
              />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">Dataset not found</p>
          <p className="text-gray-400 text-sm mt-1">
            The dataset "{datasetId}" was not found or failed to load.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 text-sm hover:underline"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const tabs = TABS.map((tab) => {
    if (tab === "Columns")
      return { name: tab, count: catalogData?.columns?.length || 0 };
    if (tab === "Properties")
      return {
        name: tab,
        count: Object.keys(catalogData?.properties || {}).length || 0,
      };
    return { name: tab, count: undefined };
  });

  const qualityColor =
    detail.qualityScore === "N/A"
      ? "text-gray-400"
      : parseInt(detail.qualityScore) >= 90
        ? "text-green-600"
        : "text-yellow-600";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Compliance Report Modal */}
      {showCompliance && (
        <ComplianceReportModal
          datasetName={detail.name}
          onClose={() => setShowCompliance(false)}
          complianceData={complianceData}
          refetchCatalogDetails={fetchCatalogDetail}
        />
      )}

      {/* Global search bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-lg">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Find tables, dashboards, people, and more"
              className="pl-9 pr-16 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                ⌘
              </kbd>
              <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                K
              </kbd>
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <button
            onClick={() => router.push("/")}
            className="hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Home
          </button>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <a
            href="/data-sources"
            className="hover:text-gray-600 transition-colors"
          >
            Data Sources
          </a>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <a
            href={`/data-sources/${sourceId}/datasets`}
            className="hover:text-gray-600 transition-colors"
          >
            {detail.sourceName || sourceId}
          </a>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-700 font-medium">{detail.name}</span>
        </nav>

        {/* Dataset card header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 mb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {detail.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {detail.type}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                      />
                    </svg>
                    {detail.sourceName || sourceId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewCompliance}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                View Compliance Report
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200 mt-5">
            {tabs.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name as Tab)}
                className={`flex items-center gap-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === name
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {name === "DataCard" && <SparkleIcon className={cn(activeTab === name ? "text-indigo-600 fill-indigo-600" : "text-gray-500 fill-gray-500")} strokeWidth={1} size={14} />}
                {name}
                {count !== undefined && name !== "Properties" && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${activeTab === name
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* DataCard tab body */}
        {activeTab === "DataCard" && (
          <div className="flex gap-4">
            {/* Left content */}
            <div className="flex-1 min-w-0 space-y-4">
              {detail.dataCardContent ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <MarkdownRenderer content={detail.dataCardContent} />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-2">
                      Dataset Overview
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {detail.overview}
                    </p>

                    <h3 className="text-sm font-semibold text-gray-900 mt-5 mb-2">
                      Key Fields
                    </h3>
                    <ul className="space-y-1.5">
                      {detail.keyFields.map((field) => (
                        <li
                          key={field.name}
                          className="flex items-baseline gap-2 text-sm"
                        >
                          <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 mt-[5px]" />
                          <span>
                            <span className="font-medium text-gray-800">
                              {field.name}:
                            </span>{" "}
                            <span className="text-gray-500">
                              {field.description}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Data Quality */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Data Quality
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "FRESHNESS",
                      value: detail.freshness,
                      color: "text-green-600",
                    },
                    {
                      label: "VOLUME",
                      value: detail.volume,
                      color: "text-green-600",
                    },
                    {
                      label: "QUALITY SCORE",
                      value: detail.qualityScore,
                      color: qualityColor,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 flex flex-col justify-center items-center"
                    >
                      <p className="text-xs font-semibold text-gray-400 tracking-wide uppercase mb-1 text-center">
                        {metric.label}
                      </p>
                      <p className={cn(`text-2xl font-extrabold ${metric.color} text-center`)}>
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <DatasetRightSidebar detail={detail} />
          </div>
        )}

        {/* Columns tab body */}
        {activeTab === "Columns" && (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white text-gray-900">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[15px] font-semibold text-gray-900">
                      Schema Definition
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                      {catalogData?.columns?.length || 0} Columns
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {reclassifyAiScanPhase === "never" && (
                      <button
                        onClick={handleReclassificationActionWithAI}
                        className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors bg-white shadow-sm"
                      >
                        <SparkleIcon className="w-3.5 h-3.5" />
                        Reclassify with AI
                      </button>
                    )}
                    {reclassifyAiScanPhase === "scanning" && (
                      <button
                        disabled
                        className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      >
                        <Loader2 className="text-indigo-400 animate-spin w-3.5 h-3.5" />
                        Reclassifying...
                      </button>
                    )}
                    {["re-scan", "complete"].includes(reclassifyAiScanPhase) && (
                      <button
                        onClick={() => {
                          setReclassifyAiScanPhase("re-scan");
                          handleReclassificationActionWithAI();
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        Reclassified
                      </button>
                    )}
                    <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-md bg-white transition-colors shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                      Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-md bg-white transition-colors shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[300px] border-b border-gray-100 relative">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                        <th className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Column Name</th>
                        <th className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Classification</th>
                        <th className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Terms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedColumns.map((col: any, idx: number) => {
                        const globalIdx = (columnsPage - 1) * columnsPerPage + idx;
                        const ai = aiResults[col.name];
                        return (
                          <tr key={col.name} className="hover:bg-gray-50/50 transition-colors bg-white">
                            <td className="py-2.5 px-3 text-[13px] text-gray-400">{globalIdx + 1}</td>
                            <td className="py-2.5 px-3 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="text-[13px] font-bold text-gray-900">{col.name}</span>
                                <span className="text-[10px] font-semibold text-gray-400 leading-none">
                                  {col.is_nullable ? "NULLABLE" : "NOT NULL"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top">
                              <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 text-[11px] font-mono font-semibold border border-gray-200/60 leading-none inline-block">
                                {(col.type || col.data_type || "UNKNOWN").toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[13px] text-gray-500 whitespace-normal align-top leading-relaxed max-w-[200px]">
                              {col?.description || "No description yet."}
                            </td>
                            <td className="py-2.5 px-3 align-top">
                              <div className="flex flex-col gap-2 relative top-0.5">
                                {ai ? (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2.5 py-0.5 rounded-full bg-[#fdf5d3] text-[#a97500] text-[11px] font-bold">
                                        {ai?.tag_name ? ai?.tag_name?.toUpperCase() : ""}
                                      </span>
                                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 text-[10px] font-semibold border border-indigo-100/50 w-fit">
                                        <SparkleIcon className="w-3 h-3" /> AI
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div style={{ width: `${ai.confidence_score * 100}%` }} className="h-full bg-green-500 rounded-full" />
                                      </div>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        {Math.round(ai.confidence_score * 100)}%
                                      </span>
                                    </div>
                                  </>
                                ) : col.tags?.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {col.tags.map((tag: any) => (
                                      <span key={tag.id} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold">
                                        {tag?.name || ""}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[12px] text-gray-300">—</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top pb-[20px]">
                               <div className="flex flex-col gap-1.5">
                                 {/* Mock Terms matching Screenshot */}
                                 {idx === 0 ? (
                                   <div className="flex flex-col gap-1 items-start">
                                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100/50">Customer ID</span>
                                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100/50">UID</span>
                                   </div>
                                 ) : idx === 1 ? (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100/50">Email</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100/50">Contact Info</span>
                                  </div>
                                 ) : idx === 3 ? (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100/50">SSN</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100/50">Social Security</span>
                                  </div>
                                 ) : (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="text-[12px] text-gray-300">—</span>
                                  </div>
                                 )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="border-t border-gray-100">
                  <Pagination 
                    currentPage={columnsPage} 
                    totalPages={Math.ceil((catalogData?.columns?.length || 0) / columnsPerPage)} 
                    onPageChange={setColumnsPage} 
                    itemName="columns" 
                    totalItems={catalogData?.columns?.length || 0} 
                    itemsPerPage={columnsPerPage} 
                  />
                </div>
              </div>

              {/* Data Preview Card */}
              <div className="bg-[#fbfcff] rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col mb-10">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-[16px] font-semibold text-gray-900 mb-1">Data Preview</h2>
                  <p className="text-[13px] text-gray-500 font-medium">
                    {previewData 
                      ? `Showing ${previewData.showing} of ${previewData.total_row_count}K rows` 
                      : isPreviewLoading ? "Loading preview..." : "No data available"}
                  </p>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[400px] bg-[#fbfcff] relative min-h-[150px]">
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="animate-spin text-indigo-500 mb-2" size={24} />
                      <span className="text-gray-500 text-sm font-semibold">Fetching Sample...</span>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#fbfcff] shadow-sm">
                        <tr className="border-b border-gray-200/60">
                          {previewHeaders.map(header => (
                            <th key={header} className="py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100/80 font-mono text-[12px] bg-white text-gray-600">
                        {previewData?.rows?.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            {previewHeaders.map(header => (
                              <td key={`${i}-${header}`} className="py-2.5 px-3">{row[header]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="border-t border-gray-100 bg-[#fbfcff]">
                  {previewData && (
                    <Pagination 
                      currentPage={previewPage} 
                      totalPages={Math.ceil(previewData.total_row_count / previewPerPage)} 
                      onPageChange={setPreviewPage} 
                      itemName="rows" 
                      totalItems={previewData.total_row_count} 
                      itemsPerPage={previewPerPage} 
                    />
                  )}
                </div>
              </div>
            </div>

            <DatasetRightSidebar detail={detail} />
          </div>
        )}

        {/* Other tabs — placeholder */}
        {activeTab === "Lineage" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: "600px" }}>
            <DatasetLineage datasetId={datasetId} datasetName={detail.name} />
          </div>
        )}

        {activeTab === "Queries" && (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <DatasetQueriesTab catalogId={datasetId} datasetName={catalogData?.table_name || ""} />
            </div>

            <DatasetRightSidebar detail={detail} />
          </div>
        )}

        {activeTab !== "DataCard" && activeTab !== "Columns" && activeTab !== "Lineage" && activeTab !== "Queries" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">
              {activeTab} — coming soon
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DatasetDetailPage;

