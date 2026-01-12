'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      const response = await api.get('/api/stats/overview');
      return response.data;
    }
  });

  const { data: trends } = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const response = await api.get('/api/stats/trends?period=7d');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.tasks?.total || 0,
      subtitle: `${stats?.tasks?.active || 0} active`,
      icon: CheckCircle2,
      color: 'text-blue-500'
    },
    {
      title: 'Total Executions',
      value: stats?.executions?.total || 0,
      subtitle: `${stats?.executions?.last24Hours || 0} last 24h`,
      icon: Activity,
      color: 'text-green-500'
    },
    {
      title: 'Success Rate',
      value: `${(stats?.successRate || 0).toFixed(2)}%`,
      subtitle: 'Overall success',
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    {
      title: 'Dead Letter Jobs',
      value: stats?.deadLetterJobs || 0,
      subtitle: 'Requires attention',
      icon: XCircle,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Execution Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Execution Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.executions?.byStatus || {}).map(([status, count]: [string, any]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize text-sm font-medium">{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ 
                          width: `${(count / stats?.executions?.total) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full" onClick={() => window.location.href = '/dashboard/tasks'}>
              Create New Task
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard/executions'}>
              View Executions
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard/analytics'}>
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
