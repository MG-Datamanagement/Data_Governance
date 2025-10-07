import { LineageData } from "../LineageGraph/types";

export const SAMPLE_DATA: LineageData = {
  center_table: {
    table_id: 1,
    table_name: "customers",
    schema_name: "public",
    data_source_name: "Core Banking System"
  },
  upstream_links: [
    {
      source_table: {
        id: 8,
        name: "aml_flags",
        schema_name: "reporting",
        data_source_name: "Regulatory Reporting Warehouse"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "FEED BACK TO customers",
      depth: 1,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 7,
        name: "fraud_alerts",
        schema_name: "public",
        data_source_name: "Fraud Detection Engine"
      },
      target_table: {
        id: 8,
        name: "aml_flags",
        schema_name: "reporting",
        data_source_name: "Regulatory Reporting Warehouse"
      },
      transformation_logic: "JOIN aml_flags WITH segments",
      depth: 2,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 6,
        name: "investment_portfolios",
        schema_name: "wealth",
        data_source_name: "Customer Data Hub"
      },
      target_table: {
        id: 7,
        name: "fraud_alerts",
        schema_name: "public",
        data_source_name: "Fraud Detection Engine"
      },
      transformation_logic: "UPDATE aml_flags FROM fraud_alerts",
      depth: 3,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 7,
        name: "fraud_alerts",
        schema_name: "public",
        data_source_name: "Fraud Detection Engine"
      },
      transformation_logic: "segment_id TO customer_segments_table",
      depth: 3,
      direction: "upstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 8,
        name: "aml_flags",
        schema_name: "reporting",
        data_source_name: "Regulatory Reporting Warehouse"
      },
      transformation_logic: "transaction_type TO transaction_summary",
      depth: 2,
      direction: "upstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "JOIN ON customer_id",
      depth: 3,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "risk_score = calculated_risk",
      depth: 3,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "customer_id = account_customer_id",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "amount > threshold",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "credit_score FROM credit_cards",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "alert_level TO fraud_alerts",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "transaction_type = txn_type",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "segment_id = customer_segment",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "loan_id = credit_loan_id",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "balance = account_balance",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "customer_segment = segment_id",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "accounts.balance TO total_balance",
      depth: 1,
      direction: "upstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 3,
        name: "transactions",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "transactions.amount TO flagged_amount",
      depth: 1,
      direction: "upstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 3,
        name: "transactions",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "INSERT INTO transactions FROM accounts",
      depth: 2,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 4,
        name: "loans",
        schema_name: "public",
        data_source_name: "Loan Origination System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "loans.principal TO total_loans",
      depth: 1,
      direction: "upstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 3,
        name: "transactions",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 4,
        name: "loans",
        schema_name: "public",
        data_source_name: "Loan Origination System"
      },
      transformation_logic: "SELECT * FROM transactions JOIN accounts",
      depth: 2,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 5,
        name: "credit_cards",
        schema_name: "public",
        data_source_name: "Credit Card Processing"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "credit_cards.credit_score TO risk_score",
      depth: 1,
      direction: "upstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 4,
        name: "loans",
        schema_name: "public",
        data_source_name: "Loan Origination System"
      },
      target_table: {
        id: 5,
        name: "credit_cards",
        schema_name: "public",
        data_source_name: "Credit Card Processing"
      },
      transformation_logic: "AGGREGATE payments",
      depth: 2,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 6,
        name: "investment_portfolios",
        schema_name: "wealth",
        data_source_name: "Customer Data Hub"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "fraud_alerts.alert_level TO alert_status",
      depth: 1,
      direction: "upstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 5,
        name: "credit_cards",
        schema_name: "public",
        data_source_name: "Credit Card Processing"
      },
      target_table: {
        id: 6,
        name: "investment_portfolios",
        schema_name: "wealth",
        data_source_name: "Customer Data Hub"
      },
      transformation_logic: "FILTER suspicious transactions",
      depth: 2,
      direction: "upstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "loyalty_points TO customer_summary_table",
      depth: 1,
      direction: "upstream",
      lineage_type: "column_to_table"
    }
  ],
  downstream_links: [
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "JOIN ON customer_id",
      depth: 1,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 3,
        name: "transactions",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "INSERT INTO transactions FROM accounts",
      depth: 2,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 3,
        name: "transactions",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 4,
        name: "loans",
        schema_name: "public",
        data_source_name: "Loan Origination System"
      },
      transformation_logic: "SELECT * FROM transactions JOIN accounts",
      depth: 3,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 3,
        name: "transactions",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "transactions.amount TO flagged_amount",
      depth: 3,
      direction: "downstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "customer_segment = segment_id",
      depth: 2,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "accounts.balance TO total_balance",
      depth: 2,
      direction: "downstream",
      lineage_type: "table_to_column"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 7,
        name: "fraud_alerts",
        schema_name: "public",
        data_source_name: "Fraud Detection Engine"
      },
      transformation_logic: "segment_id TO customer_segments_table",
      depth: 2,
      direction: "downstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 7,
        name: "fraud_alerts",
        schema_name: "public",
        data_source_name: "Fraud Detection Engine"
      },
      target_table: {
        id: 8,
        name: "aml_flags",
        schema_name: "reporting",
        data_source_name: "Regulatory Reporting Warehouse"
      },
      transformation_logic: "JOIN aml_flags WITH segments",
      depth: 3,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 8,
        name: "aml_flags",
        schema_name: "reporting",
        data_source_name: "Regulatory Reporting Warehouse"
      },
      transformation_logic: "transaction_type TO transaction_summary",
      depth: 2,
      direction: "downstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 8,
        name: "aml_flags",
        schema_name: "reporting",
        data_source_name: "Regulatory Reporting Warehouse"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "FEED BACK TO customers",
      depth: 3,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 9,
        name: "market_trades",
        schema_name: "markets",
        data_source_name: "Market Data Feed"
      },
      transformation_logic: "customer_id TO customer_activity_table",
      depth: 2,
      direction: "downstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 9,
        name: "market_trades",
        schema_name: "markets",
        data_source_name: "Market Data Feed"
      },
      target_table: {
        id: 10,
        name: "cash_positions",
        schema_name: "treasury",
        data_source_name: "Treasury Management System"
      },
      transformation_logic: "MERGE into reporting",
      depth: 3,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 10,
        name: "cash_positions",
        schema_name: "treasury",
        data_source_name: "Treasury Management System"
      },
      transformation_logic: "amount TO total_payments_table",
      depth: 2,
      direction: "downstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "loyalty_points TO customer_summary_table",
      depth: 2,
      direction: "downstream",
      lineage_type: "column_to_table"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 9,
        name: "market_trades",
        schema_name: "markets",
        data_source_name: "Market Data Feed"
      },
      transformation_logic: "SEGMENT customers",
      depth: 1,
      direction: "downstream",
      lineage_type: "table_to_table"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "customer_id = account_customer_id",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "amount > threshold",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "credit_score FROM credit_cards",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "alert_level TO fraud_alerts",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "transaction_type = txn_type",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "segment_id = customer_segment",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "loan_id = credit_loan_id",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "balance = account_balance",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    },
    {
      source_table: {
        id: 1,
        name: "customers",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      target_table: {
        id: 2,
        name: "accounts",
        schema_name: "public",
        data_source_name: "Core Banking System"
      },
      transformation_logic: "risk_score = calculated_risk",
      depth: 1,
      direction: "downstream",
      lineage_type: "column_to_column"
    }
  ],
  metadata: {
    max_depth_reached: 3,
    total_upstream_links: 26,
    total_downstream_links: 24,
    include_columns: false
  }
}