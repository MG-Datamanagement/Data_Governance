import { useState } from "react";
import { dashboardApiServices } from "@/services/dashboardApiServices";
import { useAppStore } from "@/store/appStore";

export const useCreateDataSource = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { setAddDsConfig } = useAppStore();

    const createDataSource = async ({
        selectedId,
        connector,
        config,
        schedule,
        finish,
        onSuccess,
        onClose
    }: {
        selectedId: string | null;
        connector: any;
        config: any;
        schedule: any;
        finish: any;
        onSuccess?: (jobId: string, sourceName: string) => void;
        onClose: () => void;
    }) => {
        if (!selectedId) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            let payload: any = {
                name: finish.name || connector.defaultName,
                source_type: selectedId,
                description: finish.name || `Source for ${connector.name}`,
                schedule: `${schedule.hour}:${schedule.minute} ${schedule.timezone === 'Asia/Calcutta' ? 'GMT+5:30' : schedule.timezone}`,
                owner_id: finish.owner_id,
            };

            if (selectedId === 'postgresql') {
                payload.source_type = 'postgres';

                let hostPort = config.uri || "host.docker.internal:5432";
                let dbName = "test";

                if (config.uri && config.uri.includes("://")) {
                    try {
                        const url = new URL(config.uri.replace("postgresql://", "http://"));
                        hostPort = url.host;
                        dbName = url.pathname.slice(1).split('?')[0] || "test";
                    } catch (e) {
                        console.error("Failed to parse URI for PostgreSQL", e);
                    }
                }

                payload.connection_details = {
                    host_port: hostPort,
                    database: dbName,
                    username: config.username,
                    password: config.password,
                };
                payload.include_views = true;
                payload.include_tables = true;
                payload.schema_pattern = ["public"];
                payload.table_pattern = [".*"];
            } else if (selectedId === 'mongodb') {
                payload.connection_details = {
                    connect_uri: config.uri,
                    username: config.username,
                    password: config.password,
                    enableSchemaInference: config.schemaInference,
                    useRandomSampling: config.randomSampling,
                    maxSchemaSize: parseInt(config.maxSchemaSize) || 300,
                };
                payload.include_views = false;
                payload.include_tables = true;
            } else if (selectedId === 'athena') {
                payload.connection_details = {
                    username: config.username,
                    password: config.password,
                    aws_region: config.aws_region,
                    work_group: config.work_group,
                    s3_staging_dir: config.s3_staging_dir,
                };
            }

            const createdSource = await dashboardApiServices.createDataSource(selectedId as any, payload);

            let jobId = "";
            if (createdSource && (createdSource.id || createdSource.source_id)) {
                const sourceId = createdSource.id || createdSource.source_id;
                if (sourceId) {
                    const ingestRes = await dashboardApiServices.ingestSource(sourceId);
                    jobId = ingestRes.job_id;
                    setAddDsConfig({ ...config, ...finish, sourceId, jobId })
                }
            }

            if (onSuccess && jobId) {
                onSuccess(jobId, finish.name || connector.defaultName);
            } else {
                onClose();
            }
        } catch (err: any) {
            setSubmitError(err.message || "Failed to create data source");
        } finally {
            setIsSubmitting(false);
        }
    };

    return { createDataSource, isSubmitting, submitError };
};
