import React from "react";

interface ConnectorIconProps {
    icon: string;
    className?: string;
}

const ConnectorIcon: React.FC<ConnectorIconProps> = ({
    icon,
    className = "w-9 h-9",
}) => {
    const icons: Record<string, React.ReactNode> = {
        airflow: (
            <svg viewBox="0 0 40 40" className={className}>
                <circle cx="20" cy="20" r="16" fill="#017CEE" />
                <g fill="#fff">
                    <path d="M20 9a11 11 0 0 1 11 11h-5a6 6 0 0 0-6-6z" />
                    <path d="M31 20a11 11 0 0 1-11 11v-5a6 6 0 0 0 6-6z" />
                    <path d="M20 31A11 11 0 0 1 9 20h5a6 6 0 0 0 6 6z" />
                    <path d="M9 20A11 11 0 0 1 20 9v5a6 6 0 0 0-6 6z" />
                </g>
            </svg>
        ),

        athena: (
            <svg viewBox="0 0 40 40" className={className}>
                <path d="M20 5l13 7v16l-13 7-13-7V12z" fill="#7A3EF0" />
                <circle cx="20" cy="20" r="4.5" fill="#fff" />
            </svg>
        ),

        azure: (
            <svg viewBox="0 0 40 40" className={className}>
                <rect x="5" y="5" width="13" height="13" fill="#F25022" />
                <rect x="22" y="5" width="13" height="13" fill="#7FBA00" />
                <rect x="5" y="22" width="13" height="13" fill="#00A4EF" />
                <rect x="22" y="22" width="13" height="13" fill="#FFB900" />
            </svg>
        ),

        bigquery: (
            <svg viewBox="0 0 40 40" className={className}>
                <circle cx="17" cy="17" r="10" fill="#4285F4" />
                <circle cx="17" cy="17" r="5" fill="#fff" />
                <rect
                    x="23"
                    y="23"
                    width="9"
                    height="4"
                    rx="2"
                    transform="rotate(45 23 23)"
                    fill="#4285F4"
                />
            </svg>
        ),

        cassandra: (
            <svg viewBox="0 0 40 40" className={className}>
                <ellipse cx="20" cy="20" rx="12" ry="7" fill="#1287B1" />
                <ellipse cx="20" cy="20" rx="5" ry="3" fill="white" />
                <circle cx="20" cy="20" r="2" fill="#1287B1" />
            </svg>
        ),

        clickhouse: (
            <svg viewBox="0 0 40 40" className={className}>
                <rect x="8" y="10" width="5" height="20" fill="#FACC15" />
                <rect x="17" y="10" width="5" height="20" fill="#F59E0B" />
                <rect x="26" y="10" width="5" height="20" fill="#EF4444" />
            </svg>
        ),

        cockroach: (
            <svg viewBox="0 0 40 40" className={className}>
                <path
                    d="M20 6c-7 0-12 5-12 11s5 13 12 13 12-7 12-13-5-11-12-11z"
                    fill="#6933FF"
                />
                <path
                    d="M14 20h12M16 24l4 4 4-4M16 16l4-3 4 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        ),

        csv: (
            <svg viewBox="0 0 40 40" className={className}>
                <rect x="9" y="5" width="22" height="30" rx="3" fill="#16A34A" />
                <path d="M14 14h12M14 20h12M14 26h8" stroke="#fff" strokeWidth="2" />
            </svg>
        ),

        dagster: (
            <svg viewBox="0 0 40 40" className={className}>
                <path d="M20 5l13 7v16l-13 7-13-7V12z" fill="#5C4EE5" />
                <circle cx="20" cy="20" r="4.5" fill="#fff" />
            </svg>
        ),

        databricks: (
            <svg viewBox="0 0 40 40" className={className}>
                <g fill="#FF3621">
                    <polygon points="8,12 20,6 32,12 20,18" />
                    <polygon points="8,20 20,14 32,20 20,26" />
                    <polygon points="8,28 20,22 32,28 20,34" />
                </g>
            </svg>
        ),

        dbt: (
            <svg viewBox="0 0 40 40" className={className}>
                <polygon points="20,6 34,30 6,30" fill="#FF694B" />
                <polygon points="20,14 28,28 12,28" fill="#FFA07A" />
            </svg>
        ),

        elasticsearch: (
            <svg viewBox="0 0 40 40" className={className}>
                <path
                    d="M20 6a14 14 0 0 1 11 6H20z"
                    fill="#FEC514"
                />
                <path
                    d="M20 6a14 14 0 0 0-11 6h11z"
                    fill="#00BFB3"
                />
                <path
                    d="M9 12a14 14 0 0 0 22 0 14 14 0 0 1-11 22A14 14 0 0 1 9 12z"
                    fill="#1BA9F5"
                />
            </svg>
        ),

        kafka: (
            <svg viewBox="0 0 40 40" className={className}>
                <g fill="#231F20">
                    <circle cx="20" cy="8" r="3" />
                    <circle cx="20" cy="20" r="3" />
                    <circle cx="20" cy="32" r="3" />
                    <circle cx="10" cy="14" r="2.5" />
                    <circle cx="30" cy="26" r="2.5" />
                </g>
                <g stroke="#231F20" strokeWidth="2" fill="none">
                    <path d="M20 8v24" />
                    <path d="M20 20L10 14" />
                    <path d="M20 20L30 26" />
                </g>
            </svg>
        ),

        mongodb: (
            <svg viewBox="0 0 40 40" className={className}>
                <path
                    d="M20 6c-4 6-6 11-6 17 0 6 3 11 6 11s6-5 6-11c0-6-2-11-6-17z"
                    fill="#00ED64"
                />
                <path d="M20 6v28" stroke="#00684A" strokeWidth="1.4" />
            </svg>
        ),

        mysql: (
            <svg viewBox="0 0 40 40" className={className}>
                <path
                    d="M8 24c5-10 18-10 24-2-3-1-6 0-8 2 3 2 3 5 0 7-2-2-4-2-7-1-4 2-7 0-9-6z"
                    fill="#00758F"
                />
                <circle cx="27" cy="15" r="1.3" fill="#00758F" />
            </svg>
        ),

        postgresql: (
            <svg viewBox="0 0 40 40" className={className}>
                <path
                    d="M11 22c0-7 5-11 9-11s9 4 9 11-5 9-9 9-9-2-9-9z"
                    fill="#336791"
                />
                <path
                    d="M20 18c3-3 7-2 7 1s-3 5-7 5"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                />
                <circle cx="27" cy="18" r="1.5" fill="white" />
            </svg>
        ),

        redshift: (
            <svg viewBox="0 0 40 40" className={className}>
                <polygon points="20,6 32,12 20,18 8,12" fill="#D1324B" />
                <polygon points="8,12 20,18 20,32 8,26" fill="#B91C3C" />
                <polygon points="32,12 20,18 20,32 32,26" fill="#EF4444" />
            </svg>
        ),

        snowflake: (
            <svg viewBox="0 0 40 40" className={className}>
                <g stroke="#29B5E8" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 5v30" />
                    <path d="M5 20h30" />
                    <path d="M10 10l20 20" />
                    <path d="M30 10L10 30" />
                    <path d="M20 10l3 3-3 3-3-3z" fill="#29B5E8" />
                    <path d="M20 24l3 3-3 3-3-3z" fill="#29B5E8" />
                </g>
            </svg>
        ),
    };

    return <>{icons[icon] ?? null}</>;
};

export default ConnectorIcon;