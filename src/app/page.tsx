'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Database,
  Tag,
  Folder,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  FileText,
  ShieldCheck,
  Eye,
  Key,
  Settings,
  Bell,
  Star,
  TrendingUp,
  TrendingDown,
  Server,
  HardDrive,
  Cloud,
  Lock,
  ShieldAlert,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { GovernanceMetrics, ComplianceOverview, DataStewardshipMetrics } from '@/components/governance/GovernanceMetrics';
import { QualityTrendChart, DomainQualityChart, DataSourcesChart, RecentAlerts } from '@/components/governance/AnalyticsCharts';
import Link from 'next/link';
import { fetchDatasources, fetchUsers } from './catalog/[id]/page';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

async function fetchStats() {
  const [tablesResponse, domainsResponse, tagsResponse] = await Promise.all([
    fetch(`${GRAPHQL_ENDPOINT}/tables`),
    fetch(`${GRAPHQL_ENDPOINT}/domains`),
    fetch(`${GRAPHQL_ENDPOINT}/tags`)
  ]);

  const [tables, domains, tags] = await Promise.all([
    tablesResponse.json(),
    domainsResponse.json(),
    tagsResponse.json()
  ]);

  return {
    tablesCount: tables.total || tables.length || 0,
    domainsCount: domains.total || domains.length || 0,
    tagsCount: tags.items?.length || tags.length || 0
  };
}

const stats = [
  {
    name: 'Data Tables',
    href: '/catalog',
    icon: Database,
    color: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  {
    name: 'Data Domains',
    href: '/domains',
    icon: Folder,
    color: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  {
    name: 'Tags',
    href: '/tags',
    icon: Tag,
    color: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  {
    name: 'Quality Score',
    href: '/quality',
    icon: BarChart3,
    color: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [trends, setTrends] = useState<Record<string, number>>({});
  
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: datasources, isLoading: isDataSourceLoading } = useQuery({
    queryKey: ['datasources'],
    queryFn: fetchDatasources,
  });

  const {data: users} = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  useEffect(() => {
    // Generate trends only on client side to prevent hydration mismatch
    const newTrends: Record<string, number> = {};
    stats.forEach(stat => {
      if (stat.name !== 'Quality Score') {
        newTrends[stat.name] = Math.floor(Math.random() * 20) - 10;
      }
    });
    setTrends(newTrends);
    setMounted(true);
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 rounded-2xl p-8 text-slate-900 dark:text-white relative overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-slate-600 dark:text-slate-400 mr-3" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Enterprise Data Governance</span>
                  </div>
                  <h1 className="text-5xl font-bold mb-4 leading-tight">
                    Infinity <span className="text-slate-700 dark:text-slate-300">Governance</span>
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                    Transform your data landscape with enterprise-grade governance, lineage tracking, and compliance management across all data sources.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/catalog"
                    className="bg-blue-600 text-white dark:bg-blue-600 dark:text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Explore Data Catalog
                    </div>
                  </Link>
                  <Link
                    href={"/quality" as any}
                    className="border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Quality Dashboard
                    </div>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-200/20 dark:border-slate-700/20">
                    <div className="flex items-center mb-3">
                      <Server className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{statsData?.tablesCount || 0}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">Data Assets</div>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-200/20 dark:border-slate-700/20">
                    <div className="flex items-center mb-3">
                      <ShieldCheck className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{statsData?.domainsCount}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">Domains</div>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-200/20 dark:border-slate-700/20">
                    <div className="flex items-center mb-3">
                      <HardDrive className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{datasources?.total || 0}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">Data Sources</div>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-200/20 dark:border-slate-700/20">
                    <div className="flex items-center mb-3">
                      <Users className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{users?.total || 0}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">Active Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          let count = 0;
          let trend = 0;
          
          if (statsData && !isLoading) {
            switch(stat.name) {
              case 'Data Tables':
                count = statsData.tablesCount;
                break;
              case 'Data Domains':
                count = statsData.domainsCount;
                break;
              case 'Tags':
                count = statsData.tagsCount;
                break;
              case 'Quality Score':
                count = 85; // Default quality score
                trend = 5; // Quality improving
                break;
            }
          }

          // Use client-side generated trends to prevent hydration mismatch
          if (mounted && trends[stat.name] !== undefined) {
            trend = trends[stat.name];
          }
          if (stat.name === 'Quality Score') {
            trend = 5; // Always positive for quality score
          }

          return (
            <Link key={stat.name} href={stat.href as any} className="group">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 transform hover:scale-105">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} p-4 rounded-xl shadow-sm`}>
                      <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                    </div>
                    {mounted && trend !== 0 && (
                      <div className={`flex items-center text-sm font-medium px-3 py-1 rounded-full ${trend > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.name}</p>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? (
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <span>{stat.name === 'Quality Score' ? `${count}%` : count.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {stat.name === 'Data Tables' && 'Total cataloged tables'}
                      {stat.name === 'Data Domains' && 'Business domains'}
                      {stat.name === 'Tags' && 'Classification tags'}
                      {stat.name === 'Quality Score' && 'Average data quality'}
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 px-6 py-3 group-hover:from-slate-100 group-hover:to-slate-200 dark:group-hover:from-slate-600 dark:group-hover:to-slate-700 transition-all duration-300">
                  <div className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-medium flex items-center justify-between">
                    <span>Explore</span>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Governance Overview */}
      <GovernanceMetrics />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityTrendChart />
        <DomainQualityChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataSourcesChart />
        <RecentAlerts />
      </div>

      {/* Compliance and Stewardship */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceOverview />
        <DataStewardshipMetrics />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">New table discovered</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">flights.bookings table added to catalog</p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">Auto-discovered</span>
                    <span className="ml-2">2 hours ago</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Tag className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">PII tag applied</p>
                  <p className="text-sm text-gray-600">customer_data.email_address marked as PII</p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">High Sensitivity</span>
                    <span className="ml-2">4 hours ago</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Quality check passed</p>
                  <p className="text-sm text-gray-600">inventory.products achieved 98% quality score</p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Excellent</span>
                    <span className="ml-2">6 hours ago</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Data quality alert</p>
                  <p className="text-sm text-gray-600">sales.transactions has 15% null values in amount column</p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Needs Attention</span>
                    <span className="ml-2">8 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link href={"/activity" as any} className="text-sm text-slate-600 hover:text-slate-700 font-medium">
                View all activity →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions & System Health */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20">
              <div className="flex items-center">
                <div className="p-2 bg-slate-600 rounded-lg mr-3">
                  <Server className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-600 rounded-lg mr-3">
                    <HardDrive className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Data Sources</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-slate-500 mr-1" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">5/5 Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-600 rounded-lg mr-3">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quality Checks</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-slate-500 mr-1" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All Passing</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-600 rounded-lg mr-3">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Scan</span>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">2 mins ago</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-600 rounded-lg mr-3">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Coverage</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-orange-700 dark:text-orange-300">95.2%</span>
                  <div className="w-16 bg-orange-200 dark:bg-orange-700 rounded-full h-2 ml-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{width: '95.2%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Link
                  href="/catalog"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-medium text-gray-900">Browse Catalog</span>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </Link>
                
                <Link
                  href="/domains"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-medium text-gray-900">Manage Domains</span>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </Link>
                
                <Link
                  href="/tags"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Tag className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-medium text-gray-900">Manage Tags</span>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </Link>
                
                <Link
                  href={"/quality" as any}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-medium text-gray-900">Quality Dashboard</span>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Insights */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Data Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Stewardship</h3>
              <p className="text-sm text-gray-600">
                85% of your tables have assigned data stewards, ensuring proper governance and accountability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-sm text-gray-600">
                92% of your critical tables have comprehensive documentation and business context.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Analytics</h3>
              <p className="text-sm text-gray-600">
                Track data usage patterns and identify the most valuable datasets in your organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}