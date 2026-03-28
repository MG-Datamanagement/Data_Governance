"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, Check, Zap, X, CheckCircle2, Circle, Tag, ArrowDown } from 'lucide-react';
import { useGetIngestionLoadingStages, useGetPostIngestionLoadingStages } from '@/hooks/useDashboardQueries';
import { logger } from '@/lib/logger';
import { useAppStore } from '@/store/appStore';
import { InlineState } from '@/components/ui/InlineState';

interface IngestionLog {
    timestamp: string;
    level: string;
    message: string;
}

interface IngestingDataset {
    name: string;
    rows: string | number;
    status: 'Ingesting' | 'Ready' | 'Error';
    piiTag?: string;
}

interface Step {
    label: string;
    status: 'pending' | 'active' | 'completed';
}

interface LiveIngestionPanelProps {
    jobId: string;
    sourceId: string;
    sourceName: string;
    onClose: () => void;
    onNotFound?: () => void;
}

const LiveIngestionPanel: React.FC<LiveIngestionPanelProps> = ({ jobId, sourceId, sourceName, onClose, onNotFound }) => {
    const { addToast } = useAppStore();
    const [isScanning, setIsScanning] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pre-fetch both stage lists via React Query — results are cached and
    // deduplicated so concurrent callers (e.g. IngestionSidebar) share one request.
    const { data: ingestionData } = useGetIngestionLoadingStages();
    const { data: postIngestionData } = useGetPostIngestionLoadingStages();

    const advanceStep = useCallback((idx: number, stepList: Step[]) => {
        if (idx >= stepList.length) return;

        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'active' } : s));

        stepTimerRef.current = setTimeout(() => {
            setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'completed' } : s));
            
            const nextIdx = idx + 1;
            if (nextIdx < stepList.length) {
                advanceStep(nextIdx, stepList);
            }
        }, 1800);
    }, []);

    const fetchInitialSteps = useCallback(() => {
        try {
            const loads = ingestionData?.ingestion_loads ?? [];
            if (loads.length === 0) return;
            const initialSteps = loads.map((label: string) => ({ label, status: 'pending' as const }));
            setSteps(initialSteps);
            advanceStep(0, initialSteps);
        } catch(e) {
            console.error(e);
        }
    }, [ingestionData, advanceStep]);

    const appendPostIngestionSteps = useCallback(() => {
        try {
            const loads = postIngestionData?.reasoning_loads ?? [];
            if (loads.length === 0) return;
            const newSteps = loads.map((label: string) => ({ label, status: 'pending' as const }));
            setSteps(prev => {
                const updated = prev.map(s => ({ ...s, status: 'completed' as const }));
                const combined = [...updated, ...newSteps];
                if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
                advanceStep(updated.length, combined);
                return combined;
            });
        } catch(e) {
            console.error(e);
        }
    }, [postIngestionData, advanceStep]);

    useEffect(() => {
        if (ingestionData) {
            fetchInitialSteps();
        }
        return () => {
            if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingestionData]);

    const [datasets, setDatasets] = useState<IngestingDataset[]>([]);
    const [logs, setLogs] = useState<IngestionLog[]>([]);
    const [totalTables, setTotalTables] = useState<number | null>(null);
    const [completedTables, setCompletedTables] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const eventSourceRef = useRef<EventSource | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        if (!jobId) return;

        logger.info(`Connecting to SSE for job: ${jobId}`);
        const url = `${process.env.NEXT_PUBLIC_DASHBOARD_API_URL || 'http://172.188.2.173:8005'}/api/v1/jobs/${jobId}/logs/stream`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                // SSE format might have "data: " prefix handled by EventSource
                const log: IngestionLog = JSON.parse(event.data);
                handleNewLog(log);
            } catch (err) {
                logger.error("Failed to parse log message", { error: err, data: event.data });
            }
        };

        es.addEventListener('log', (event: any) => {
            try {
                const log: IngestionLog = JSON.parse(event.data);
                handleNewLog(log);
            } catch (err) {
                logger.error("Failed to parse log event", { error: err });
            }
        });

        es.addEventListener('done', (event: any) => {
            logger.info("Ingestion job completed.");
            setIsComplete(true);
            setSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));
            es.close();
        });

        es.onerror = (err) => {
            logger.error("SSE Error", { error: err });
            // If we get an error immediately and have no data, it's likely a 404 or connection issue
            if (datasets.length === 0 && logs.length === 0) {
                onNotFound?.();
            }
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [jobId]);

    const handleNewLog = (log: IngestionLog) => {
        setLogs(prev => [...prev, log]);

        const msg = log.message;

        if (msg.includes("Found") && msg.includes("total tables")) {
            const match = msg.match(/Found (\d+) total tables/);
            if (match) setTotalTables(parseInt(match[1]));
        } else if (msg.includes("PostgresSink closed")) {
            const recordsMatch = msg.match(/Total records written: (\d+)/);
            if (recordsMatch) {
                setCompletedTables(prev => prev + 1);
            }
        } else if (msg.includes("Ingestion job completed")) {
            setIsComplete(true);
            setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        } else if (msg.includes("Duplicate key")) {
            logger.warn("Ingestion warning", { msg });
        }
    };

    const handlePiiScan = async () => {
        setIsScanning(true);
        appendPostIngestionSteps();
        try {
            const response = await fetch('http://172.188.2.173:8005/api/v1/scan/source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_id: sourceId,
                    save_to_db: true,
                    assigned_by: "ai-auto",
                    min_confidence: 0
                })
            });
            if (response.ok) {
                addToast("PII Scan triggered successfully", "success");
            } else {
                addToast("Failed to trigger PII Scan", "error");
            }
        } catch (err) {
            logger.error("PII Scan error", { error: err });
            addToast("Error connecting to scan service", "error");
        } finally {
            setIsScanning(false);
        }
    };

    const totalSteps = Math.max(12, steps.length);
    const progress = steps.filter(s => s.status === 'completed').length + (isComplete ? 2 : 1);

    return (
        <>
            {/* Pipeline Progress */}
            <div className="bg-white border flex-1 border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-5 bg-white shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-widest">Pipeline Progress</h3>
                        <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-indigo-600">{progress}/{totalSteps} steps</span>
                                    <button onClick={onClose} className="rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors">
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-[6px] mb-4 overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-1000 ease-in-out"
                                    style={{ width: `${Math.min(100, (progress / totalSteps) * 100)}%` }}
                                />
                            </div>
                            
                            {/* Phase Badge */}
                            <div className="flex items-center gap-3 mt-4">
                                {(() => {
                                    const activeStep = steps.find(s => s.status === 'active');
                                    const isActiveReasoning = activeStep && (activeStep.label.toLowerCase().includes('classif') || activeStep.label.toLowerCase().includes('tag') || activeStep.label.toLowerCase().includes('scan') || activeStep.label.toLowerCase().includes('summary') || activeStep.label.toLowerCase().includes('reasoning'));
                                    return (
                                        <>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isActiveReasoning ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {isActiveReasoning ? (
                                                    <Tag className="w-4 h-4 fill-current" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-sm bg-indigo-500 flex items-center justify-center">
                                                        <ArrowDown className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                    </div>
                                                )}
                                                {isActiveReasoning ? 'Classifying' : 'Ingesting'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 truncate">
                                                {activeStep ? activeStep.label : (isComplete ? 'Execution Complete' : 'Preparing...')}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Scrollable list */}
                        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar-thick border-t border-gray-50 pt-3">
                            {steps.length === 0 ? (
                                <div className="mt-8">
                                    <InlineState type="loading" message="Initializing ingestion pipeline..." />
                                </div>
                            ) : steps.map((step, idx) => {
                                const isReasoningStep = step.label.toLowerCase().includes('classif') || step.label.toLowerCase().includes('tag') || step.label.toLowerCase().includes('scan') || step.label.toLowerCase().includes('summary') || step.label.toLowerCase().includes('reasoning');
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-3.5 mx-2 mb-1.5 rounded-xl transition-colors ${step.status === 'active' ? 'bg-indigo-50/60' : 'bg-white'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="mt-0.5 shrink-0">
                                                {step.status === 'completed' ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : step.status === 'active' ? (
                                                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-200" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-[14px] font-medium transition-colors ${step.status === 'active' ? 'text-indigo-600' : step.status === 'completed' ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                                {step.status === 'completed' && step.label.toLowerCase().includes('found tables') && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="bg-green-500 rounded flex shrink-0 items-center justify-center" style={{ width: '16px', height: '16px'}}>
                                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-medium">Found schemas</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isReasoningStep && (
                                            <div className={`shrink-0 ml-4 ${step.status === 'completed' ? 'text-gray-300' : step.status === 'active' ? 'text-orange-400' : 'text-orange-200'}`}>
                                                <Tag className="w-4 h-4 fill-current" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Footer Force Actions */}
                        <div className="p-5 border-t border-gray-100 shrink-0 bg-gray-50 flex gap-3">
                            <button
                                onClick={handlePiiScan}
                                disabled={isScanning || isComplete}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white text-xs font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                                {isScanning ? 'Triggering Scan...' : 'Complete with PII scan'}
                            </button>
                            <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 text-xs font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all">
                                <Zap className="w-4 h-4" />
                                Complete, skip PII
                            </button>
            </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar-thick::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar-thick::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-thick::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                .custom-scrollbar-thick::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </>
    );
};

export default LiveIngestionPanel;
