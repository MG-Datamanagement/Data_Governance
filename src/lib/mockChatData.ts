import { Agent, ChatDataset } from "@/types";
import { GoWorkflow } from "react-icons/go";
import { FiGitBranch } from "react-icons/fi";
import { GoDatabase } from "react-icons/go";
import { TbZoomScan } from "react-icons/tb";
import { LuShieldCheck } from "react-icons/lu";
import { MdOutlinePolicy } from "react-icons/md";

export const MOCK_AGENTS: Agent[] = [
  {
    id: "schema_scout",
    name: "Schema Scout",
    description: "Analyzes table schemas and column types",
    icon: TbZoomScan,
    disabled: false,
  },
  {
    id: "pii_detective",
    name: "PII Detective",
    description: "Detects sensitive & personal data",
    icon: LuShieldCheck,
    disabled: false,
  },
  {
    id: "compliance_guardian",
    name: "Compliance Guardian",
    description: "Checks policy violations & enforcement",
    icon: MdOutlinePolicy,
    disabled: false,
  },
  {
    id: "lineage_tracker",
    name: "Lineage Tracker",
    description: "Maps upstream & downstream dependencies",
    icon: FiGitBranch,
    disabled: false,
  },
  {
    id: "sql_agent",
    name: "SQL Agent",
    description: "Generates & runs SQL queries",
    icon: GoDatabase,
    disabled: false,
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    description: "Coordinates multi-agent workflows",
    alert: `Enable "Multi-Agent" in preference`,
    tag: "Multi",
    icon: GoWorkflow,
    disabled: true,
  },
];

export const MOCK_DATASETS: ChatDataset[] = [
  {
    id: "customers_prod",
    name: "customers_prod",
    type: "PostgreSQL",
    columns: 18,
    rows: 12400,
  },
  {
    id: "orders_master",
    name: "orders_master",
    type: "PostgreSQL",
    columns: 24,
    rows: 450000,
  },
  {
    id: "transactions_ledger",
    name: "transactions_ledger",
    type: "Snowflake",
    columns: 32,
    rows: 1200000,
  },
  {
    id: "user_profiles",
    name: "user_profiles",
    type: "MongoDB",
    columns: 14,
    rows: 8300,
  },
  {
    id: "product_catalog",
    name: "product_catalog",
    type: "Snowflake",
    columns: 12,
    rows: 850,
  },
];
