"use client";

/**
 * AddDataSourceModal.tsx — Orchestrator
 *
 * Reduced from 829 lines to ~100 lines by extracting all step components
 * into the add-datasource/ sub-directory.
 *
 * Sub-components:
 *  - add-datasource/ModalChrome.tsx — Stepper + ModalFooter
 *  - add-datasource/Step1.tsx       — Choose Data Source (connector grid + search)
 *  - add-datasource/Step2.tsx       — Configure Connection (forms + YAML mode)
 *  - add-datasource/Step3.tsx       — Sync Schedule
 *  - add-datasource/Step4.tsx       — Finish Up (summary, name, owner, PII, notifications)
 */

import React, { useEffect, useState, useMemo } from "react";
import { ApiOwner } from "@/services/dashboardApiServices";
import { useAppStore } from "@/store/appStore";
import { useGetOwnersList } from "@/hooks/useDashboardQueries";
import { useCreateDataSource } from "@/hooks/useCreateDataSource";
import { CONNECTORS } from "@/lib/connectors";
import { Stepper } from "@/components/ui/Stepper";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { Step1 } from "../add-datasource/Step1";
import { Step2, DataSourceConfig } from "../add-datasource/Step2";
import { Step3, ScheduleConfig } from "../add-datasource/Step3";
import { Step4, FinishConfig } from "../add-datasource/Step4";

interface AddDataSourceModalProps {
  onClose: () => void;
  onSuccess?: (jobId: string, sourceName: string) => void;
}

const AddDataSourceModal: React.FC<AddDataSourceModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [config, setConfig] = useState<DataSourceConfig>({
    uri: "", username: "", password: "",
    host_port: "", database: "",
    aws_region: "", work_group: "", s3_staging_dir: "",
    schemaInference: true, randomSampling: true, maxSchemaSize: "300", yamlMode: false,
    processing_engine: "glue", query_source: "cloudwatch",
    glue_region: "us-east-1", glue_job_name: "customer360-etl-job", glue_job_run_id: "", glue_track_latest_run: true,
    cw_region: "us-east-1", cw_log_group_name: "/aws/spark/etl-jobs", cw_log_stream_name: "*", cw_filter_pattern: "SELECT",
    common_access_key_id: "", common_secret_access_key: "", common_role_arn: "arn:aws:iam::123456789012:role/log-reader",
  });

  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: true, frequency: "Daily", hour: "00", minute: "00", timezone: "Asia/Calcutta",
  });

  const [finish, setFinish] = useState<FinishConfig>({
    name: "", piiEnabled: true, piiApproval: true, failureEmail: "", owner_id: "",
  });

  const { setAddDsConfig } = useAppStore();
  const { data: ownersData } = useGetOwnersList();
  const owners = useMemo(() => (ownersData as ApiOwner[]) || [], [ownersData]);

  useEffect(() => {
    if (owners.length > 0 && !finish.owner_id) {
      setFinish((p: any) => ({ ...p, owner_id: owners[0].id }));
    }
  }, [owners, finish.owner_id]);

  const connector = CONNECTORS.find((c) => c.id === selectedId) ?? CONNECTORS[0];
  const updateConfig = (k: string, v: string | boolean) => setConfig((p: any) => ({ ...p, [k]: v }));
  const updateSchedule = (k: string, v: string | boolean) => setSchedule((p: any) => ({ ...p, [k]: v }));
  const updateFinish = (k: string, v: string | boolean) => setFinish((p: any) => ({ ...p, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const { createDataSource, isSubmitting, submitError } = useCreateDataSource();
  const handleSubmit = () => createDataSource({ selectedId, connector, config, schedule, finish, onSuccess, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Title bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Connect Data Source</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Stepper steps={["Choose Data Source", "Configure Connection", "Sync Schedule", "Finish up"]} current={step} />

        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {submitError}
          </div>
        )}

        {step === 1 && <Step1 selected={selectedId} onSelect={setSelectedId} />}
        {step === 2 && <Step2 connector={connector} config={config} onChange={updateConfig} />}
        {step === 3 && <Step3 schedule={schedule} onChange={updateSchedule} />}
        {step === 4 && <Step4 connector={connector} config={config} schedule={schedule} finish={finish} owners={owners} onChange={updateFinish} />}

        {step < 4 ? (
          <ModalFooter onPrev={step > 1 ? prev : undefined} onNext={next} nextDisabled={step === 1 && !selectedId} />
        ) : (
          <ModalFooter
            onPrev={prev}
            onNext={handleSubmit}
            nextLabel={isSubmitting ? "Saving..." : "Save & Run"}
            nextDisabled={isSubmitting}
            extraButtons={
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default AddDataSourceModal;
