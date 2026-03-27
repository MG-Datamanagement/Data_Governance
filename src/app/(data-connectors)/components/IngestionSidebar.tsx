"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Bell, History, Check, Loader2, Database, Shield, Zap, Search, AlertCircle, ShieldCheckIcon, ArrowRight, CheckCircle2, Circle, Tag, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { CONSTANTS } from '@/lib/constants';
import { dashboardApiServices, SourceAiSummaryResponse } from '@/services/dashboardApiServices';
import { useGetIngestionLoadingStages, useGetPostIngestionLoadingStages } from '@/hooks/useDashboardQueries';
import { RiRobot2Fill } from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface IngestionLog {
    timestamp: string;
    level: string;
    message: string;
}

interface Step {
    label: string;
    description?: string;
}

type IngestionPhase = "scanning" | "completing" | "done";

interface IngestionSidebarProps {
    jobId: string;
    sourceName: string;
    isOpen: boolean;
    onClose: (viewIngestedDataset: boolean) => void;
}

import { useIngestionSidebar } from "@/hooks/useIngestionSidebar";

const IngestionSidebar: React.FC<IngestionSidebarProps> = ({ jobId, sourceName, isOpen, onClose }) => {
    const {
        scrollRef, mainScrollRef,
        steps, phase, currentStepIdx, completedSteps,
        isThinking, progress, totalSteps, showNotification,
        logs, isComplete, isProgressExpanded, setIsProgressExpanded,
        streamStatus, sourceAiSummary, isSourceAiSummaryLoading,
        summaryError, hasAttemptedPhase2, ingestionStepsCount,
        addDsConfig,
        appendPostIngestionSteps, handleBatchApis, onCloseReset, handleFetchIngestionSourceAiSummary,
    } = useIngestionSidebar(jobId, isOpen, onClose);

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

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {/* Notification Toast (Inside Sidebar top) */}
                    {showNotification && (
                        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-2 shadow-lg flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
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
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mb-2 relative transition-all duration-500",
                            isComplete ? "bg-emerald-100" : "bg-indigo-50 border-2 border-indigo-100 isp-pulse-ring"
                        )}>
                            {!isComplete && (
                                <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-30" />
                            )}
                            {isComplete ? (
                                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in duration-500 isp-check-icon shadow-lg border-2 border-white">
                                    <Check className="w-7 h-7 text-white stroke-[3]" />
                                </div>
                            ) : (
                                <div className="relative flex flex-col items-center justify-center translate-y-2">
                                    <RiRobot2Fill className="w-8 h-8 text-indigo-500" />
                                    <div className="flex gap-1 mt-1.5 h-1.5 items-center">
                                        <span className="w-1 h-1 bg-indigo-400 rounded-full isp-dot-1" />
                                        <span className="w-1 h-1 bg-indigo-400 rounded-full isp-dot-2" />
                                        <span className="w-1 h-1 bg-indigo-400 rounded-full isp-dot-3" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <h4 className={cn(
                            "text-base font-bold tracking-tight transition-colors duration-500 text-center",
                            isComplete ? "text-emerald-700" : (phase === "done" ? "text-indigo-600 animate-pulse" : "text-gray-800")
                        )}>
                            {isComplete 
                                ? 'Ingestion Complete' 
                                : (totalSteps === 0 
                                    ? 'Analyzing Data Source...'
                                    : (phase === "done" 
                                        ? 'Finalizing Analysis...' 
                                        : (steps[currentStepIdx]?.label ?? 'Schema Discovery')))}
                        </h4>
                    </div>

                    {/* Pipeline Progress */}
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-500">
                        <button
                            onClick={() => setIsProgressExpanded(!isProgressExpanded)}
                            className="px-2.5 py-2 bg-white shrink-0 hover:bg-gray-50 flex flex-col w-full text-left transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Pipeline Progress</h3>
                                    {(() => {
                                        if (totalSteps === 0) {
                                            return (
                                                <div className="bg-gray-100 text-gray-400 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase animate-pulse">
                                                    Analyzing...
                                                </div>
                                            );
                                        }
                                        const activeStep = steps[currentStepIdx];
                                        const isClassification = activeStep && (
                                            activeStep.label.toLowerCase().includes('pii') ||
                                            activeStep.label.toLowerCase().includes('tag') ||
                                            activeStep.label.toLowerCase().includes('confid') ||
                                            activeStep.label.toLowerCase().includes('complia') ||
                                            activeStep.label.toLowerCase().includes('policy') ||
                                            activeStep.label.toLowerCase().includes('summary')
                                        );

                                        if (!activeStep && !isComplete) return null;

                                        return (
                                            <div className={cn(
                                                "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase transition-all duration-500",
                                                isComplete ? "bg-emerald-100 text-emerald-700" : (isClassification ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700 text-opacity-90')
                                            )}>
                                                {isComplete ? 'Done' : (isClassification ? 'Classification' : 'Ingestion')}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-indigo-600 tabular-nums">
                                        {totalSteps === 0 ? '--' : progress}/{totalSteps === 0 ? '--' : totalSteps} steps
                                    </span>
                                    {isProgressExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-[6px] overflow-hidden relative">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000 ease-in-out",
                                        isComplete ? "bg-emerald-500" : (totalSteps === 0 ? "bg-gray-200" : "isp-shimmer-bar")
                                    )}
                                    style={{ width: `${totalSteps === 0 ? 0 : (progress / totalSteps) * 100}%` }}
                                />
                            </div>
                        </button>

                        <div
                            className={cn(
                                "overflow-hidden transition-all duration-500 ease-in-out",
                                isProgressExpanded ? "max-h-[400px] border-t border-gray-50 pt-2" : "max-h-0"
                            )}
                        >
                            <div ref={scrollRef} className="overflow-y-auto px-1 pb-2 custom-scrollbar-thick scroll-smooth max-h-[400px]">
                                {steps.map((step, idx) => {
                                    // Only render steps that the animation has reached
                                    if (idx > currentStepIdx && phase !== "done") return null;

                                    const isDone = completedSteps.has(idx) || phase === "done";
                                    const isActive = !isDone && idx === currentStepIdx;

                                    // Enhanced detection for reasoning/classification steps
                                    const isReasoningStep = step.label.toLowerCase().includes('pii') ||
                                        step.label.toLowerCase().includes('tag') ||
                                        step.label.toLowerCase().includes('scan') ||
                                        step.label.toLowerCase().includes('complian') ||
                                        step.label.toLowerCase().includes('policy') ||
                                        step.label.toLowerCase().includes('summary') ||
                                        step.label.toLowerCase().includes('reasoning');

                                    return (
                                        <div key={idx} className={cn(
                                            "isp-fade-up flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-500",
                                            isActive ? "bg-indigo-50/80 border-l-2 border-indigo-500 shadow-sm" : "bg-white border-l-2 border-transparent"
                                        )} style={{ animationDelay: isComplete ? `${idx * 50}ms` : '0ms' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="mt-0.5 shrink-0 w-6 h-6 flex items-center justify-center">
                                                    {isDone ? (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <svg className="isp-check" width="12" height="12" viewBox="0 0 10 10" fill="none">
                                                                <path d="M2 5l2.5 2.5L8 3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    ) : isActive ? (
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-indigo-50 border border-indigo-200">
                                                            <svg className="isp-spin" width="12" height="12" viewBox="0 0 10 10" fill="none">
                                                                <circle cx="5" cy="5" r="3.5" stroke="#c7d2fe" strokeWidth="1.5" />
                                                                <path d="M5 1.5A3.5 3.5 0 018.5 5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-gray-50 bg-gray-50/30 flex items-center justify-center">
                                                            <span className="text-[9px] font-bold text-gray-300">{idx + 1}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={cn(
                                                        "text-[12.5px] font-semibold leading-tight transition-colors duration-500",
                                                        isDone ? "text-gray-600" : isActive ? "text-indigo-800" : "text-gray-300"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                    {isDone && step.label.toLowerCase().includes('found tables') && (
                                                        <div className="flex items-center gap-1.5 mt-2 transition-all animate-in fade-in slide-in-from-left-2 duration-700">
                                                            <div className="bg-emerald-500 rounded-sm w-3 h-3 flex items-center justify-center shadow-sm">
                                                                <Check className="w-2 text-white" strokeWidth={4} />
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Verified Schema</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isReasoningStep && (
                                                <div className={cn(
                                                    "shrink-0 ml-4 transition-all duration-500",
                                                    isDone ? "text-gray-200" : isActive ? "text-purple-400 scale-110" : "text-gray-100"
                                                )}>
                                                    <Tag className="w-4 h-4 fill-current" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Require Approval for PII Scan Actions */}
                    {(streamStatus === "completed" && addDsConfig?.piiApproval && !hasAttemptedPhase2) ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700 px-1">
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-2 flex items-start gap-4 shadow-sm border-l-4 border-l-orange-400">
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-[11px] font-bold text-orange-800 mb-0.5">Action Required</h5>
                                    <p className="text-[10px] text-orange-700/80 leading-relaxed font-medium">Ingestion successful. A scan is recommended to identify **PII & sensitive patterns** for full compliance.</p>
                                </div>
                            </div>
                            <div className='w-full flex justify-between items-center gap-3 transition-all'>
                                <div className="flex-1">
                                    <Button onClick={() => onCloseReset(false)} variant="outline" className='w-full py-3 text-xs font-bold border-gray-200 hover:bg-gray-50 text-gray-600 transition-all'>
                                        <ArrowRight size={14} className="mr-1.5" />
                                        Complete, skip PII
                                    </Button>
                                </div>
                                <div className="flex-1">
                                    <Button onClick={() => { appendPostIngestionSteps(); handleBatchApis(); }} className='w-full py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all active:scale-95'>
                                        <ShieldCheckIcon size={14} className="mr-1.5" />
                                        Complete with PII
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* AI Summary Block — Revealed only when complete or when explicitly loading in the final phase */}
                    {(isComplete || (isSourceAiSummaryLoading && hasAttemptedPhase2) || summaryError) && (sourceAiSummary?.ai_summary || isSourceAiSummaryLoading || summaryError) &&
                        <div className='bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg transition-all space-y-3'>
                            <div className='text-indigo-600 flex items-center gap-2'>
                                {isSourceAiSummaryLoading ? <Loader2 size={14} className='animate-spin' /> : <RiRobot2Fill size={14} />}
                                {isSourceAiSummaryLoading 
                                    ? <span className='text-xs font-medium'>Generating Ingestion Insights...</span> 
                                    : <span className='text-xs font-medium'>Summary</span>}
                            </div>
                            {summaryError ? (
                                <div className="space-y-3 py-2 flex flex-col items-center">
                                    <p className="text-gray-500 text-[11px] text-center italic leading-tight">Detailed ingestion insights could not be generated at this moment.</p>
                                    <div className="flex justify-center items-center gap-2 w-full">
                                        <Button 
                                            variant="outline" 
                                            className="text-[10px] py-2 bg-white border-gray-200 text-indigo-600 hover:text-indigo-700 font-bold px-4 transition-all"
                                            onClick={handleFetchIngestionSourceAiSummary}
                                        >
                                            Retry Insights
                                        </Button>
                                    </div>
                                </div>
                            ) : (sourceAiSummary?.ai_summary) && (
                                <div className='space-y-3 flex flex-col items-center'>
                                    <p className='text-gray-600 leading-relaxed text-xs'>{sourceAiSummary?.ai_summary}</p>
                                </div>
                            )}
                        </div>}
                </div>

                {/* Footer Placeholder (Removed) */}
                <div className="p-6 pt-0" />

                {/* Custom styling for scrollbar and animations */}
                <style jsx>{`
                    @keyframes isp-slide-in {
                        from { transform: translateX(100%); opacity: 0; }
                        to   { transform: translateX(0);    opacity: 1; }
                    }
                    @keyframes isp-fade-up {
                        from { opacity: 0; transform: translateY(10px); }
                        to   { opacity: 1; transform: translateY(0);    }
                    }
                    @keyframes isp-shimmer {
                        0%   { background-position: -300% center; }
                        100% { background-position:  300% center; }
                    }
                    @keyframes isp-pulse-ring {
                        0%   { transform: scale(0.95); box-shadow: 0 0 0 0   rgba(99,102,241,0.5); }
                        70%  { transform: scale(1);    box-shadow: 0 0 0 8px rgba(99,102,241,0);   }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0   rgba(99,102,241,0);   }
                    }
                    @keyframes isp-spin { to { transform: rotate(360deg); } }
                    @keyframes isp-dot {
                        0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
                        40%           { transform: scale(1);   opacity: 1;   }
                    }
                    @keyframes isp-check-draw {
                        from { stroke-dashoffset: 20; }
                        to   { stroke-dashoffset: 0;  }
                    }
                    @keyframes isp-bar-grow {
                        from { width: 0%; }
                    }

                    .isp-panel         { animation: isp-slide-in 0.38s cubic-bezier(0.22,1,0.36,1) both; }
                    .isp-fade-up       { animation: isp-fade-up  0.4s cubic-bezier(0.22,1,0.36,1) both; }
                    .isp-shimmer-bar {
                        background: linear-gradient(90deg, #6366f1 0%, #818cf8 35%, #c7d2fe 50%, #818cf8 65%, #6366f1 100%);
                        background-size: 300% 100%;
                        animation: isp-shimmer 1.8s linear infinite;
                    }
                    .isp-pulse-ring    { animation: isp-pulse-ring 1.6s ease-out infinite; }
                    .isp-spin          { animation: isp-spin 0.9s linear infinite; }
                    .isp-dot-1         { animation: isp-dot 1.3s ease-in-out 0s    infinite; }
                    .isp-dot-2         { animation: isp-dot 1.3s ease-in-out 0.2s  infinite; }
                    .isp-dot-3         { animation: isp-dot 1.3s ease-in-out 0.4s  infinite; }
                    .isp-check path    { stroke-dasharray: 20; animation: isp-check-draw 0.3s ease-out forwards; }

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
