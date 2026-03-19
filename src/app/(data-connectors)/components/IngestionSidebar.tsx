"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Bell, History, Check, Loader2, Database, Shield, Zap, Search, AlertCircle, ShieldCheckIcon, ArrowRight, CheckCircle2, Circle, Tag, ArrowDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { CONSTANTS } from '@/lib/constants';
import { dashboardApiServices, SourceAiSummaryResponse } from '@/services/dashboardApiServices';
import { RiRobot2Fill } from 'react-icons/ri';
import { useRouter } from 'next/navigation';

interface IngestionLog {
    timestamp: string;
    level: string;
    message: string;
}

interface Step {
    label: string;
    status: 'pending' | 'active' | 'completed';
}

interface IngestionSidebarProps {
    jobId: string;
    sourceName: string;
    isOpen: boolean;
    onClose: (viewIngestedDataset: boolean) => void;
}

const IngestionSidebar: React.FC<IngestionSidebarProps> = ({ jobId, sourceName, isOpen, onClose }) => {
    const [steps, setSteps] = useState<Step[]>([]);
    const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const fetchInitialSteps = async () => {
        try {
            const res = await dashboardApiServices.getIngestionLoadingSteps();
            const initialSteps = res.ingestion_loads.map((label: string) => ({ label, status: 'pending' as const }));
            setSteps(initialSteps);
            advanceStep(0, initialSteps);
        } catch(e) {
            console.error(e);
        }
    }

    const appendPostIngestionSteps = async () => {
        setIsThinking(true);
        setIsComplete(false);
        try {
            const res = await dashboardApiServices.getPostIngestionLoadingSteps();
            const newSteps = res.reasoning_loads.map((label: string) => ({ label, status: 'pending' as const }));
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
    };

    const [isThinking, setIsThinking] = useState(true);
    const [progress, setProgress] = useState(1);
    const [totalSteps] = useState(12);
    const [showNotification, setShowNotification] = useState(true);
    const [logs, setLogs] = useState<IngestionLog[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const eventSourceRef = useRef<EventSource | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [streamStatus, setStreamStatus] = useState<"connecting" | "connected" | "completed" | "error">("connecting");
    const { addDsConfig, setAddDsConfig } = useAppStore();
    const router = useRouter();
    console.log(addDsConfig, "addDsConfig")
    const [sourceAiSummary, setSourceAiSummary] = useState<SourceAiSummaryResponse | null>(null);
    const [isSourceAiSummaryLoading, setIsSourceAiSummaryLoading] = useState<boolean>(false);

    const mainScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        if (isOpen) {
            fetchInitialSteps();
            const timer = setTimeout(() => setShowNotification(false), 5000);
            return () => clearTimeout(timer);
        } else {
            if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
            setSteps([]);
        }
    }, [isOpen]);

    useEffect(() => {
        // Delay execution until global store propagates the actual configuration with sourceId
        if (!jobId || !isOpen || !addDsConfig?.sourceId) return;

        // Simulate immediate completion of the streaming ingestion step
        setIsComplete(true);
        setIsThinking(false);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setProgress(totalSteps);
        setStreamStatus("completed");
        
        // Add a mock log to show it finished smoothly
        setLogs([{
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Ingestion job completed."
        }]);

        if (!addDsConfig.piiApproval) {
            handleBatchApis();
        }

        return () => {
        };
    }, [jobId, isOpen, addDsConfig?.sourceId]);

     const handleBatchApis = async () => {
       setIsSourceAiSummaryLoading(true);
       try {
        await Promise.allSettled([
         handleTableClassification(),
         handleColumnClassification(),
         handleGenerateBulkDataCards(),
         handleFetchIngestionSourceAiSummary(),
        ]);
        setIsSourceAiSummaryLoading(false);
        setIsComplete(true);
        setIsThinking(false);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
       } catch (error) {
         console.error("Error during classification and Ai summary:", error);
         setIsSourceAiSummaryLoading(false);
       } finally {
         setIsSourceAiSummaryLoading(false);
       }
     };

     const handleTableClassification = async () => {
       try {
         const payload = {
           source_id: addDsConfig.sourceId,
           Require_human_approval: addDsConfig.piiApproval,
           assigned_by: CONSTANTS.assignedBy,
           min_confidence: CONSTANTS.minConfidence,
         };

         const response: any =
           await dashboardApiServices.initPiiClassification(payload);
       } catch (err) {
         console.error("Error during PII classification:", err);
       }
     };

     const handleColumnClassification = async () => {
       try {
         const payload = {
           source_id: addDsConfig.sourceId,
           save_to_db: CONSTANTS.saveToDb,
           assigned_by: CONSTANTS.assignedBy,
           min_confidence: CONSTANTS.minConfidence,
         };

         const { dataSourcesService } = await import("@/services/mock");
         const response: any =
           await dataSourcesService.reclassifyWithAi(payload);
       } catch (err) {
         console.error("Error during PII classification:", err);
       }
     };

     const handleFetchIngestionSourceAiSummary = async () => {
       try {
         const response: SourceAiSummaryResponse =
           await dashboardApiServices.fetchIngestionAiSummary(
             addDsConfig?.sourceId,
           );
         setSourceAiSummary(response);
         setIsSourceAiSummaryLoading(false);
       } catch (err) {
         console.error("Error during classification and Ai summary:", err);
         setIsSourceAiSummaryLoading(false);
       }
     };

     const handleGenerateBulkDataCards = async () => {
       try {
         const response: any =
           await dashboardApiServices.generateBulkSourceDatacards(addDsConfig?.sourceId);
       } catch (err) {
         console.error("Error during bulk data cards generation:", err);
       }
     };

    const handleNewLog = (log: IngestionLog) => {
        setLogs(prev => [...prev.slice(-100), log]);
        const msg = log.message;

        if (msg.includes("Job started")) {
            setProgress(2);
        } else if (msg.includes("Found") && msg.includes("total tables")) {
            setProgress(3);
        } else if (msg.includes("PostgresSink connected")) {
            setProgress(4);
        } else if (msg.includes("PostgresSink closed")) {
            setProgress(p => Math.min(p + 1, totalSteps - 2));
        } else if (msg.includes("Metadata ingestion complete")) {
            setProgress(totalSteps - 1);
        } else if (msg.includes("Ingestion job completed")) {
            setIsComplete(true);
            setIsThinking(false);
            setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
            setProgress(totalSteps);
        }
    };

    const onCloseReset = (viewIngestedDataset: boolean = false) => {
        onClose(viewIngestedDataset)
        setStreamStatus("connecting")
        setIsSourceAiSummaryLoading(false)
        setSourceAiSummary(null)
        setAddDsConfig({})
    } 

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 backdrop-blur-[1px] z-[60] transition-opacity duration-300"
                onClick={() => onCloseReset(false)}
            />

            {/* Sidebar Container */}
            <div 
                ref={mainScrollRef}
                className={`fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >

                {/* Header */}
                <div className="bg-indigo-600 p-4 text-white relative flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Zap className="w-4 h-4 text-white fill-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold font-sans">AI Ingestion Agent</h2>
                                <p className="text-xs text-indigo-100 opacity-80">Data pipeline overview</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 hover:bg-white/20 p-1 rounded-xl transition-colors cursor-pointer">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div className="bg-white/10 hover:bg-white/20 p-1 rounded-xl transition-colors cursor-pointer">
                                <History className="w-4 h-4" />
                            </div>
                            <div onClick={() => onCloseReset(false)} className="bg-white/10 hover:bg-white/20 p-1 rounded-xl transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-2">
                        <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center gap-1.5 border text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-lg ${isThinking ? 'bg-orange-500/90 border-orange-400' : 'bg-green-500 border-green-400'}`}>
                                <span className={`w-1.5 h-1.5 bg-white rounded-full ${isThinking ? 'animate-pulse' : ''}`} />
                                {isThinking ? 'Thinking' : 'Completed'}
                            </div>
                            <button className="text-xs font-medium text-white/70 hover:text-white transition-colors underline underline-offset-4">Override</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                    {/* Notification Toast (Inside Sidebar top) */}
                    {showNotification && (
                        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                <div className="p-1 rounded bg-indigo-50 border border-indigo-100">
                                    <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">Ingestion started</p>
                                <p className="text-xs text-gray-500 truncate">"{sourceName}" · {steps.length} steps identified</p>
                            </div>
                        </div>
                    )}

                    {/* Summary Info */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-12 h-12 text-indigo-600" />
                        </div>
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">AI Agent Summary</h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-2.5 h-2.5 text-green-600 stroke-[3]" />
                                </div>
                                <span className="text-xs font-medium text-gray-700">Connecting to {sourceName}...</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-green-100' : 'border border-indigo-400 border-t-transparent animate-spin'}`}>
                                    {isComplete && <Check className="w-2.5 h-2.5 text-green-600 stroke-[3]" />}
                                </div>
                                <span className="text-xs font-medium text-gray-700">Fetching dataset info...</span>
                            </div>
                        </div>
                    </div>

                    {/* Central Animation Placeholder */}
                    <div className="flex flex-col items-center justify-center p-2">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4 relative">
                            {!isComplete && (
                                <div className="absolute inset-x-0 bottom-[-5px] flex justify-center gap-1.5 opacity-40">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-0" />
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150" />
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300" />
                                </div>
                            )}
                            {isComplete ? (
                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-500">
                                    <Check className="w-7 h-7 text-white stroke-[3]" />
                                </div>
                            ) : (
                                <Zap className="w-10 h-10 text-indigo-600 fill-indigo-100" />
                            )}
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 tracking-tight">
                            {isComplete ? 'Ingestion Complete' : 'Schema Discovery'}
                        </h4>
                    </div>

                    {/* Pipeline Progress */}
                    <div className="bg-white mx-1 border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
                        <div className="p-4 bg-white shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[13px] font-semibold text-gray-800">Pipeline Progress</h3>
                                <span className="text-[11px] font-bold text-indigo-600">{progress}/{totalSteps} steps</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-[6px] mb-4 overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-1000 ease-in-out"
                                    style={{ width: `${(progress / totalSteps) * 100}%` }}
                                />
                            </div>
                            
                            {/* Phase Badge */}
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const activeStep = steps.find(s => s.status === 'active');
                                    const isActiveReasoning = activeStep && (activeStep.label.toLowerCase().includes('classif') || activeStep.label.toLowerCase().includes('tag') || activeStep.label.toLowerCase().includes('scan') || activeStep.label.toLowerCase().includes('summary') || activeStep.label.toLowerCase().includes('reasoning'));
                                    return (
                                        <>
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold ${isActiveReasoning ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {isActiveReasoning ? (
                                                    <Tag className="w-3.5 h-3.5 fill-current" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-sm bg-indigo-500 flex items-center justify-center">
                                                        <ArrowDown className="w-3 h-3 text-white" strokeWidth={3} />
                                                    </div>
                                                )}
                                                {isActiveReasoning ? 'Classifying' : 'Ingesting'}
                                            </div>
                                            <span className="text-[12px] font-medium text-gray-500 truncate">
                                                {activeStep ? activeStep.label : (isComplete ? 'Execution Complete' : 'Preparing...')}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Scrollable list */}
                        <div className="flex-1 overflow-y-auto px-1 pb-2 custom-scrollbar-thick border-t border-gray-50 pt-2">
                            {steps.map((step, idx) => {
                                const isReasoningStep = step.label.toLowerCase().includes('classif') || step.label.toLowerCase().includes('tag') || step.label.toLowerCase().includes('scan') || step.label.toLowerCase().includes('summary') || step.label.toLowerCase().includes('reasoning');
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-3 mx-2 mb-1 rounded-xl transition-colors ${step.status === 'active' ? 'bg-indigo-50/60' : 'bg-white'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 shrink-0">
                                                {step.status === 'completed' ? (
                                                    <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
                                                ) : step.status === 'active' ? (
                                                    <Loader2 className="w-[18px] h-[18px] text-indigo-500 animate-spin" />
                                                ) : (
                                                    <Circle className="w-[18px] h-[18px] text-gray-200" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-[13px] font-medium transition-colors ${step.status === 'active' ? 'text-indigo-600' : step.status === 'completed' ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                                {step.status === 'completed' && step.label.toLowerCase().includes('found tables') && (
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <div className="bg-green-500 rounded-sm w-3.5 h-3.5 flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                        </div>
                                                        <span className="text-[11px] text-gray-400 font-medium">Found schemas</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isReasoningStep && (
                                            <div className={`shrink-0 ml-4 ${step.status === 'completed' ? 'text-gray-300' : step.status === 'active' ? 'text-orange-400' : 'text-orange-200'}`}>
                                                <Tag className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Require Apporval for PII Scan Actions */}
                    {(streamStatus === "completed" && addDsConfig?.piiApproval && !isSourceAiSummaryLoading && !sourceAiSummary) ? <div className='w-full flex justify-between items-center gap-2 transition-all'>
                        <div>
                            <Button onClick={() => onCloseReset(false)} variant="outline" className='disabled:opacity-50'>
                                <ArrowRight />
                                Complete, skip PII
                            </Button>
                       </div>
                       <div>
                            <Button onClick={() => { appendPostIngestionSteps(); handleBatchApis(); }} className='disabled:opacity-50'>
                                <ShieldCheckIcon />
                                Complete with PII Scan
                            </Button>
                       </div>
                    </div> : null}
                    
                    {/* {} */}
                    {(isSourceAiSummaryLoading || sourceAiSummary?.ai_summary) &&
                    <div className='bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg transition-all space-y-3'>
                        <div className='text-indigo-600 flex items-center gap-2'>
                            {isSourceAiSummaryLoading ? <Loader2 size={14} className='animate-spin' />  : <RiRobot2Fill size={14} />}
                            {isSourceAiSummaryLoading ? <span className='text-xs font-medium'>PII Detection In-Progress</span> : <span className='text-xs font-medium'>Summary</span> }
                        </div>
                        {(sourceAiSummary?.ai_summary) && 
                        <div className='space-y-3 flex flex-col items-center'>
                            <p className='text-gray-600 leading-relaxed text-xs'>{sourceAiSummary?.ai_summary}</p>
                            <Button 
                                variant="primary" 
                                className='text-white w-full gap-2 flex justify-center items-center' 
                                onClick={() => {
                                    onCloseReset(true)
                                }}
                            >
                                <Database size={14} />
                                View Ingested Dataset
                                <ArrowRight size={14} />
                            </Button>
                        </div>
                        }
                    </div>}
                </div>

                {/* Footer Placeholder (Removed) */}
                <div className="p-6 pt-0" />

                {/* Custom styling for scrollbar */}
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #cbd5e1;
                    }
                    .custom-scrollbar-dark::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar-dark::-webkit-scrollbar-track {
                        background: #111827;
                    }
                    .custom-scrollbar-dark::-webkit-scrollbar-thumb {
                        background: #374151;
                        border-radius: 10px;
                    }
                    .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
                        background: #4b5563;
                    }
                `}</style>
            </div>
        </>
    );
};

export default IngestionSidebar;
