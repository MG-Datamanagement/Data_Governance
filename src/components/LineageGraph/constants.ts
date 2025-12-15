export const GRAPH_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 80,
  horizontalSpacing: 280,
  verticalSpacing: 140,
  colors: {
    center: '#16A34A',
    upstream: '#2563EB',
    downstream: '#EA580C',
    link: {
      upstream: '#06b6d4',
      downstream: '#10b981',
    },
  },
  zoom: {
    min: 0.1,
    max: 4,
  },
} as const;

export const UNCATEGORIZED_DOMAIN = 'Uncategorized'
