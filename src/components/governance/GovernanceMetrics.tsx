'use client';

import {
  ShieldCheck,
  Eye,
  Key,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Users,
  Lock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  progress?: number;
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon: Icon, 
  color, 
  bgColor, 
  borderColor,
  progress 
}: MetricCardProps) {
  return (
    <div className={`${bgColor} p-6 rounded-xl border ${borderColor} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium px-3 py-1 rounded-full ${
            trend > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
          }`}>
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>
      </div>
      {progress && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

export function GovernanceMetrics() {
  const metrics = [
    {
      title: 'Data Security',
      value: '96%',
      subtitle: 'Compliance Score',
      trend: 2,
      icon: ShieldCheck,
      color: 'bg-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      progress: 96
    },
    {
      title: 'Data Visibility',
      value: '89%',
      subtitle: 'Coverage',
      trend: 5,
      icon: Eye,
      color: 'bg-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      progress: 89
    },
    {
      title: 'Access Control',
      value: '94%',
      subtitle: 'Policy Enforcement',
      trend: 1,
      icon: Key,
      color: 'bg-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      progress: 94
    },
    {
      title: 'Risk Level',
      value: 'Low',
      subtitle: 'Overall Assessment',
      trend: -3,
      icon: AlertTriangle,
      color: 'bg-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-700',
      progress: 25
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

export function ComplianceOverview() {
  const complianceItems = [
    {
      category: 'GDPR Compliance',
      score: 98,
      status: 'excellent',
      icon: Lock,
      details: 'All PII data properly classified and protected'
    },
    {
      category: 'SOX Compliance',
      score: 94,
      status: 'good',
      icon: FileText,
      details: 'Financial data controls in place'
    },
    {
      category: 'Data Retention',
      score: 87,
      status: 'warning',
      icon: Clock,
      details: 'Some policies need review'
    },
    {
      category: 'Access Reviews',
      score: 92,
      status: 'good',
      icon: Users,
      details: 'Regular access audits conducted'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Overview</h3>
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4 mr-1" />
          All Critical Controls Active
        </div>
      </div>
      
      <div className="space-y-4">
        {complianceItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                item.status === 'excellent' ? 'bg-green-600' :
                item.status === 'good' ? 'bg-blue-600' :
                'bg-orange-600'
              }`}>
                <item.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{item.category}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.details}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{item.score}%</div>
              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    item.status === 'excellent' ? 'bg-green-600' :
                    item.status === 'good' ? 'bg-blue-600' :
                    'bg-orange-600'
                  }`}
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataStewardshipMetrics() {
  const stewardshipData = [
    {
      domain: 'Finance',
      steward: 'Sarah Johnson',
      tables: 45,
      quality: 96,
      issues: 2,
      status: 'excellent'
    },
    {
      domain: 'Customer Data',
      steward: 'Mike Chen',
      tables: 32,
      quality: 89,
      issues: 5,
      status: 'good'
    },
    {
      domain: 'Operations',
      steward: 'Lisa Rodriguez',
      tables: 28,
      quality: 78,
      issues: 8,
      status: 'warning'
    },
    {
      domain: 'Marketing',
      steward: 'David Kim',
      tables: 19,
      quality: 94,
      issues: 1,
      status: 'excellent'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Stewardship</h3>
        <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
          <Users className="h-4 w-4 mr-1" />
          4 Active Stewards
        </div>
      </div>
      
      <div className="space-y-4">
        {stewardshipData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                item.status === 'excellent' ? 'bg-green-600' :
                item.status === 'good' ? 'bg-blue-600' :
                'bg-orange-600'
              }`}>
                {item.steward.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{item.domain}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.steward}</div>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">{item.tables}</div>
                <div className="text-gray-500 dark:text-gray-400">Tables</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">{item.quality}%</div>
                <div className="text-gray-500 dark:text-gray-400">Quality</div>
              </div>
              <div className="text-center">
                <div className={`font-semibold ${item.issues > 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {item.issues}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Issues</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}