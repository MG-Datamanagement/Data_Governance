/** @type {import('next').NextConfig} */
const path = require('path');

// ─── Security Headers (Temporarily Disconnected but Available) ─────────────────
const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' http://localhost:8000 http://172.188.2.173:8005",
            "worker-src blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join("; "),
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
    { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    images: {
        domains: [],
        remotePatterns: [],
    },
    async headers() {
        return [
            // {
            //     source: "/:path*",
            //     headers: securityHeaders,
            // },
        ];
    },
    webpack(config) {
        // Correctly find and handle the SVG rule
        const fileLoaderRule = config.module.rules.find((rule) =>
            rule.test?.test?.(".svg")
        );

        if (fileLoaderRule) {
            fileLoaderRule.exclude = /\.svg$/i;
        }

        // Add SVGR loader specifically for source-icons
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            // Important: Restrict to source-icons to avoid metadata conflicts (e.g. icon.svg)
            include: [path.resolve(__dirname, 'src/assets/source-icons')],
            use: [
                {
                    loader: "@svgr/webpack",
                    options: {
                        icon: true,
                        svgo: true,
                        jsx: {
                            babelConfig: {
                                plugins: [
                                    [
                                        "@babel/plugin-transform-react-jsx",
                                        {
                                            throwIfNamespace: false, // Fix for "Namespace tags are not supported"
                                        },
                                    ],
                                ],
                            },
                        },
                        svgoConfig: {
                            plugins: [
                                {
                                    name: "preset-default",
                                    params: {
                                        overrides: {
                                            removeViewBox: false,
                                            cleanupIDs: false, // Disable default cleanup to allow prefixIds to handle it
                                        },
                                    },
                                },
                                {
                                    name: "prefixIds",
                                },
                                "removeXMLNS", // Strip problematic XML namespaces
                            ],
                        },
                    },
                },
            ],
        });

        return config;
    },
};

module.exports = nextConfig;
