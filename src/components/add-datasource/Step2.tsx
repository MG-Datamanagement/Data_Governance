"use client";

import React from "react";
import { ConnectorDefinition } from "@/lib/connectors";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";

/** Shared config type — covers all connector fields from the modal state */
export interface DataSourceConfig {
  uri: string;
  username: string;
  password: string;
  host_port: string;
  database: string;
  aws_region: string;
  work_group: string;
  s3_staging_dir: string;
  schemaInference: boolean;
  randomSampling: boolean;
  maxSchemaSize: string;
  yamlMode: boolean;
  processing_engine: string;
  query_source: string;
  glue_region: string;
  glue_job_name: string;
  glue_job_run_id: string;
  glue_track_latest_run: boolean;
  cw_region: string;
  cw_log_group_name: string;
  cw_log_stream_name: string;
  cw_filter_pattern: string;
  common_access_key_id: string;
  common_secret_access_key: string;
  common_role_arn: string;
}

interface Step2Props {
  connector: ConnectorDefinition;
  config: DataSourceConfig;
  onChange: (k: string, v: string | boolean) => void;
}

export const Step2: React.FC<Step2Props> = ({ connector, config, onChange }) => (
  <div className="flex-1 overflow-y-auto px-6 py-5">
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">{connector.configTitle}</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          For more information, see the{" "}
          <a href="#" className="text-indigo-600 hover:underline">{connector.docsLabel}</a>.
        </p>
      </div>
      <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
        <button onClick={() => onChange("yamlMode", false)} className={`px-3 py-1.5 transition-colors ${!config.yamlMode ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500 hover:bg-gray-50"}`}>Form View</button>
        <button onClick={() => onChange("yamlMode", true)} className={`px-3 py-1.5 transition-colors ${config.yamlMode ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500 hover:bg-gray-50"}`}>YAML View</button>
      </div>
    </div>

    {config.yamlMode ? (
      <textarea
        className="w-full h-56 font-mono text-xs border border-gray-200 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
        defaultValue={`source:\n  type: ${connector.id}\n  config:\n    connect_uri: "${config.uri || connector.uriPlaceholder}"\n    username: "${config.username}"\n    password: "***"`}
      />
    ) : (
      <div className="space-y-4">
        {connector.id !== 'athena' && connector.id !== 'redshift' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Connection URI</label>
            <Input type="text" value={config.uri} onChange={(e) => onChange("uri", e.target.value)} placeholder={connector.uriPlaceholder}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
          </div>
        )}

        {connector.id !== 'redshift' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <Input type="text" value={config.username} onChange={(e) => onChange("username", e.target.value)} placeholder="e.g. admin"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <Input type="password" value={config.password} onChange={(e) => onChange("password", e.target.value)} placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
          </div>
        )}

        {connector.id === 'athena' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">AWS Region</label>
                <Input type="text" value={config.aws_region} onChange={(e) => onChange("aws_region", e.target.value)} placeholder="e.g. us-east-1"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Group</label>
                <Input type="text" value={config.work_group} onChange={(e) => onChange("work_group", e.target.value)} placeholder="e.g. primary"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">S3 Staging Directory</label>
              <Input type="text" value={config.s3_staging_dir} onChange={(e) => onChange("s3_staging_dir", e.target.value)} placeholder="e.g. s3://athena-query-results-tmp-123/"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
          </>
        )}

        {connector.id === "redshift" && (
          <>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Processing Engine Config</h3>
                <Select value={config.processing_engine} onChange={(e) => onChange("processing_engine", e.target.value)}
                  className="bg-white py-1.5 px-3 min-w-[120px]"
                  options={[{ value: "glue", label: "AWS Glue" }]}
                />
              </div>
              {config.processing_engine === "glue" && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Region</label>
                    <Input type="text" value={config.glue_region} onChange={(e) => onChange("glue_region", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Job Name</label>
                    <Input type="text" value={config.glue_job_name} onChange={(e) => onChange("glue_job_name", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Job Run ID</label>
                    <Input type="text" value={config.glue_job_run_id} onChange={(e) => onChange("glue_job_run_id", e.target.value)} placeholder="Leave empty for latest" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div className="flex items-center mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={config.glue_track_latest_run} onChange={(e) => onChange("glue_track_latest_run", e.target.checked)} />
                      <span className="text-[11px] font-medium text-gray-700">Track Latest Run</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Query Source Config</h3>
                <Select value={config.query_source} onChange={(e) => onChange("query_source", e.target.value)}
                  className="bg-white py-1.5 px-3 min-w-[170px]"
                  options={[{ value: "cloudwatch", label: "Amazon CloudWatch" }]}
                />
              </div>
              {config.query_source === "cloudwatch" && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Region</label>
                    <Input type="text" value={config.cw_region} onChange={(e) => onChange("cw_region", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Log Group Name</label>
                    <Input type="text" value={config.cw_log_group_name} onChange={(e) => onChange("cw_log_group_name", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Log Stream Name</label>
                    <Input type="text" value={config.cw_log_stream_name} onChange={(e) => onChange("cw_log_stream_name", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Filter Pattern</label>
                    <Input type="text" value={config.cw_filter_pattern} onChange={(e) => onChange("cw_filter_pattern", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Authentication</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Access Key ID</label>
                  <Input type="text" value={config.common_access_key_id} onChange={(e) => onChange("common_access_key_id", e.target.value)} placeholder="AKIA..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Secret Access Key</label>
                  <Input type="password" value={config.common_secret_access_key} onChange={(e) => onChange("common_secret_access_key", e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Role ARN</label>
                  <Input type="text" value={config.common_role_arn} onChange={(e) => onChange("common_role_arn", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-3">Options (recommended)</p>
          <div className="space-y-3">
            {[
              { key: "schemaInference", label: "Enable Schema Inference", desc: "Infer schema from data samples", value: config.schemaInference },
              { key: "randomSampling", label: "Use Random Sampling", desc: "Sample random rows for profiling", value: config.randomSampling },
            ].map((opt) => (
              <label key={opt.key} className="flex items-start justify-between cursor-pointer gap-4">
                <div>
                  <p className="text-sm text-gray-700 font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                <Checkbox checked={opt.value} onChange={(e) => onChange(opt.key, e.target.checked)} />
              </label>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Schema Size</label>
              <Input type="text" value={config.maxSchemaSize} onChange={(e) => onChange("maxSchemaSize", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
