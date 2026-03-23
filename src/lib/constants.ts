export const CONSTANTS = {
    defaultAgentName: "sql_agent",
    defaultDatasetName: "catalogs",
    minConfidence: 0.75,
    assignedBy: "ai-auto",
    RequireHumanApproval: true,
    saveToDb: true,
    userUrn: "urn:li:corpuser:datahub",
}

export const RedshiftConfig = {
    username: process.env.REDSHIFT_USERNAME || process.env.NEXT_PUBLIC_REDSHIFT_USERNAME || "",
    password: process.env.REDSHIFT_PASSWORD || process.env.NEXT_PUBLIC_REDSHIFT_PASSWORD || "",
    aws_region: process.env.REDSHIFT_REGION || process.env.NEXT_PUBLIC_REDSHIFT_REGION || "ap-southeast-1",
    work_group: process.env.REDSHIFT_WORK_GROUP || process.env.NEXT_PUBLIC_REDSHIFT_WORK_GROUP || "primary",
    s3_staging_dir: process.env.REDSHIFT_S3_STAGING_DIR || process.env.NEXT_PUBLIC_REDSHIFT_S3_STAGING_DIR || "s3://athena-query-results-tmp-123/"
}

export const manualFixSqlTemplate = `
CREATE TABLE booking_transaction_fixed
WITH (
  format = 'PARQUET',
  external_location = 's3://infinity-gov-test/data/data-lineage/booking_transaction_fixed/'
) AS
SELECT
    bookingid,
    bookingtype,
    bookingutc,
    currencycode,
 
    transactionid,
    transactionamount,
    transactiontype,
    transactionstatus,
    paymentmethod,
 
    CAST(journey_time AS VARCHAR) AS journey_time
 
FROM booking_transaction;
`