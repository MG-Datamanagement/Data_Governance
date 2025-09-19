'use client';

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const qualityTrendData = [
  { month: 'Jan', quality: 78, issues: 145 },
  { month: 'Feb', quality: 82, issues: 132 },
  { month: 'Mar', quality: 85, issues: 128 },
  { month: 'Apr', quality: 88, issues: 115 },
  { month: 'May', quality: 91, issues: 98 },
  { month: 'Jun', quality: 89, issues: 105 },
  { month: 'Jul', quality: 94, issues: 87 }
];

const domainQualityData = [
  { domain: 'Finance', quality: 96, tables: 45 },
  { domain: 'Customer', quality: 89, tables: 32 },
  { domain: 'Operations', quality: 78, tables: 28 },
  { domain: 'Marketing', quality: 94, tables: 19 },
  { domain: 'HR', quality: 87, tables: 15 }
];

const dataSourcesData = [
  { name: 'PostgreSQL', value: 35, color: '#3B82F6' },
  { name: 'MySQL', value: 25, color: '#10B981' },
  { name: 'Oracle', value: 20, color: '#F59E0B' },
  { name: 'Snowflake', value: 15, color: '#8B5CF6' },
  { name: 'BigQuery', value: 5, color: '#EF4444' }
];

const recentAlerts = [
  {
    id: 1,
    type: 'quality',
    severity: 'high',
    message: 'Data quality dropped below 85% in customer.transactions',
    time: '5 min ago',
    icon: AlertTriangle,
    color: 'text-red-600'
  },
  {
    id: 2,
    type: 'access',
    severity: 'medium',
    message: 'Unusual access pattern detected in finance.payroll',
    time: '15 min ago',
    icon: ShieldCheck,
    color: 'text-orange-600'
  },
  {
    id: 3,
    type: 'compliance',
    severity: 'low',
    message: 'PII scan completed successfully across all tables',
    time: '1 hour ago',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    id: 4,
    type: 'lineage',
    severity: 'medium',
    message: 'New data lineage discovered in reporting.sales_summary',
    time: '2 hours ago',
    icon: FileText,
    color: 'text-blue-600'
  }
];

export function QualityTrendChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Quality Trends</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly quality score progression</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="h-4 w-4 mr-1" />
            +6% this month
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={qualityTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                color: '#F9FAFB'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="quality" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DomainQualityChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Domain Quality Scores</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quality by business domain</p>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={domainQualityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="domain" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                color: '#F9FAFB'
              }} 
            />
            <Bar dataKey="quality" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DataSourcesChart() {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Sources</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Distribution by source type</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataSourcesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataSourcesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="ml-6 space-y-2">
          {dataSourcesData.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {entry.name} ({entry.value}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecentAlerts() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest system notifications</p>
          </div>
        </div>
        <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
          <Eye className="h-4 w-4 mr-1" />
          View All
        </div>
      </div>
      
      <div className="space-y-4">
        {recentAlerts.map((alert) => (
          <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`p-2 rounded-lg ${
              alert.severity === 'high' ? 'bg-red-100 text-red-600' :
              alert.severity === 'medium' ? 'bg-orange-100 text-orange-600' :
              'bg-green-100 text-green-600'
            }`}>
              <alert.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {alert.message}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.severity.toUpperCase()}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{alert.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}